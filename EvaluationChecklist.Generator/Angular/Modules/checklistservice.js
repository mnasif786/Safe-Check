angular.module('checklistService', ['configService']).
    factory('ChecklistService', function ($http, $q, ConfigService, $filter, $rootScope, $modal, $window, $timeout, ClientQuestionService, ClientServiceREST, ClientEmployeeService, ChecklistTemplateService) {

        var getQuestionsByQuestionId = function (questionsArray, questionId) {
            var question = null;
            $.each(questionsArray, function (index, item) {
                if (item.Id == questionId) {
                    question = item;
                    return false;
                }
            });

            return question;
        };


        var getQuestionsByQuestionsArrayId = function (questionsArray, questionIdsArray) {

            if (questionIdsArray == null)
                return null;

            var questions = [];

            $.each(questionIdsArray, function (index, questionIdsArrayItem) {
                // get relevant questions with lower order no 
                var results = $filter('filter')(questionsArray, function (item) {
                    return item.Id == questionIdsArrayItem;
                });

                if (results != null && results.length > 0) {
                    questions.push(results[0]);
                }
            });

            return questions;
        };

        var config = ConfigService.getConfig();

        var getChecklistFromLocalStorageByClientId = function (clientId) {

            var checklistIndexViewModel = [];
            for (var key in $window.localStorage) {
                if (key.indexOf('Checklist') > -1) {
                    var checklistStoredLocally = JSON.parse(localStorage[key]);
                    if (checklistStoredLocally.ClientId == clientId) {
                        checklistIndexViewModel.push(convertChecklistToChecklistIndexViewModel(checklistStoredLocally));
                    }
                }
            }

            return checklistIndexViewModel;
        };

        //define variable to shrared between executive summary & check list


        var convertChecklistToChecklistIndexViewModel = function (checklist) {

            var visitSite = null;

            $.each(checklist.ClientDetails.Sites, function (index, site) {
                if (site.Id == checklist.SiteId) {
                    visitSite = site;
                    return;
                }
            });

            return {
                "Id": checklist.Id,
                "Title": "local store",
                "SiteName": visitSite.Address1,
                "Postcode": visitSite.Postcode,
                "CreatedOn": checklist.CreatedOn,
                "CreatedBy": checklist.CreatedBy,
                "VisitBy": "",
                "Status": null,
                "VisitDate": null
            };
        };

        var replaceChecklistInLocalStorage = function (checklistId, data, callback) {
            $window.localStorage.setItem("Checklist." + checklistId, JSON.stringify(data));
            saveLocalSyncStatus(checklistId, data.LastModifiedOn);
            saveServerSyncStatus(checklistId, data.LastModifiedOn);

            if (callback) {
                callback({ success: true, message: 'Checklist successully downloaded.' });
            }
        };

        function checkVersion(isDownload, localLastModifiedOn, serverLastModifiedOn, checklistId) {
            var syncStatus = getSyncStatus(checklistId);
            var lastLocalSave = (syncStatus.LastLocalSave != null) ? $filter('date')(syncStatus.LastLocalSave, 'yyyy/MM/dd HH:mm:ss') : '';
            //var lastServerSave = (syncStatus.LastServerSave != null) ? $filter('date')(syncStatus.LastServerSave, 'yyyy/MM/dd HH:mm:ss') : '';
            var serverSaveFormatted = $filter('date')(serverLastModifiedOn, 'yyyy/MM/dd HH:mm:ss');

            var showWarning = false;
            var title = '';
            var message = '';
            if (isDownload) {
                if (localLastModifiedOn > serverLastModifiedOn) {
                    showWarning = true;
                    title = 'Confirmation!';
                    message = "<p>The version of the checklist you are downloading appears to be out of date.  Do you want to download the latest version? </p>" +
                        '<p>Your Local Version:      ' + lastLocalSave + '<br/>' +
                        'Available Server Version:   ' + serverSaveFormatted + '</p>';
                }
            }
            else {
                if (localLastModifiedOn < serverLastModifiedOn) {
                    showWarning = true;
                    title = 'Warning!';
                    message = "<p>The version of the checklist you are editing appears to be out of date.  Do you want to download the latest version? </p>" +
                         '<p>Your Local Version:      ' + lastLocalSave + '<br/>' +
                         'Available Server Version:   ' + serverSaveFormatted + '</p>';


                }
            }
            return { showWarning: showWarning, title: title, message: message };
        }

        function showWarningDialog(title, message, checklistId, checklist, callback) {
            var modalInstance = $modal.open({
                scope: $rootScope,
                templateUrl: 'angular/partials/confirmDownloadChecklist.htm',
                controller: ConfirmDownloadChecklistController,
                resolve: {
                    options: function () {
                        return { title: title, message: message };
                    }
                }
            });

            modalInstance.result.then(function () {
                //OK clicked.
                replaceChecklistInLocalStorage(checklistId, checklist, callback);

            }, function () {
                //Cancel clicked.
                if (callback) {
                    callback({ success: true, message: '', status: 200 });
                }
            });
        }



        //if the checklist is stored locally then it will attempt to update it
        var getFromServer = function (checklistId, isDownload, callback) {
            $http({ method: "GET", url: config.apiUrl + 'checklists/' + checklistId, withCredentials: true }).success(function (serverChecklist) {

                getIndustryNameFromId(serverChecklist);

                setClientDetails(serverChecklist, function (result) {
                    //Get from local storage if same checklist exists in there.
                    var localChecklist = getChecklistFromLocalStorage(checklistId, false);

                    var serverLastModifiedOn = new Date(serverChecklist.LastModifiedOn);

                    if (serverChecklist.Deleted == true) {
                        showInformationDialog("Deleted Checklist Restored", "You are editing the local version of a report which has previously been deleted from the server. To prevent data loss, this report will be restored so you can carry on editing as normal.");
                    }

                    if (localChecklist != null) {
                        //Convert date from api to a standard format.
                        if (serverChecklist.LastModifiedOn != null && serverChecklist.LastModifiedOn.length == 19) {
                            serverChecklist.LastModifiedOn += "Z";
                        }

                        var localLastModifiedOn = new Date(localChecklist.LastModifiedOn);

                        var check = checkVersion(isDownload, localLastModifiedOn, serverLastModifiedOn, checklistId);

                        if (check.showWarning && serverChecklist.Deleted != true) {
                            showWarningDialog(check.title, check.message, checklistId, serverChecklist, callback);

                        } else {
                            callback({ success: true, message: '', status: 200, checklist: localChecklist });
                        }
                    }
                    else {
                        callback({ success: true, checklist: serverChecklist });
                    }
                });


                if (serverChecklist.Status == 'Draft') {
                    ClientEmployeeService.get(serverChecklist.ClientId, function (employees) {
                        if (serverChecklist.Status == 'Draft') {
                            $window.localStorage.setItem('Employees:' + serverChecklist.ClientId, JSON.stringify(employees));
                        }
                    });

                    ClientQuestionService.getCompleteSetOfQuestions(function (questions) {
                        if (serverChecklist.Status == 'Draft') {
                            $window.localStorage.setItem('CompleteSetOfQuestions', JSON.stringify(questions));
                        }
                    });
                }

                if (angular.isDefined(serverChecklist.IndustryId) && serverChecklist.IndustryId != null && serverChecklist.Status == 'Draft') {
                    ChecklistTemplateService.get(serverChecklist.IndustryId, function (template) {
                        if (serverChecklist.Status == 'Draft') {
                            ChecklistTemplateService.saveChecklistTemplateToLocalStorage(template);
                        }
                    });
                }

            }).error(function (data, status, headers) {
                console.log('error getting checklist ' + status);

                var msg = '';
                if (status == 404) {
                    msg = 'Checklist not found';
                }
                else if (status == 401) {
                    msg = "Not authorised to update this checklist. Please reload page and re-enter your credentials.";
                }
                else {
                    msg = 'Error occurred retrieving checklist from server, ensure you are online and try again.';
                }

                if (callback) {
                    callback({ success: false, message: msg, status: status });
                }
            });
        };

        var get = function (checklistId, callback) {
            var isDownload = false;
            var checklist = {};

            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                getFromServer(checklistId, isDownload, function (result) {
                    //by the time the code gets here the locally stored checklist would have been updated
                    checklist = getChecklistFromLocalStorage(checklistId); // if the user wants to use the server version instead of the local version it would have been updated by the time the code gets here

                    //if checklist not in local storage then use server version
                    if (checklist == null) {
                        checklist = result.checklist;
                    }

                    if (callback) {
                        callback(checklist);
                    }

                    return checklist;
                });


            }
            else {
                checklist = getChecklistFromLocalStorage(checklistId, true);
                callback(checklist);
            }

        };

        var setClientDetails = function (checklist, callback) {
            ClientServiceREST.get(checklist.ClientId, function (clientDetailsData) {

                if (clientDetailsData != '') {
                    checklist.ClientDetails = clientDetailsData;
                    if (checklist.SiteId > 0) {

                        //Selecting site
                        var sites = $.grep(checklist.ClientDetails.Sites, function (site) {
                            return site.Id == checklist.SiteId;
                        });

                        checklist.Site = sites[0];
                    }
                }

                //dont need to store all the sites and contacts anymore because the user can't change these
                if (angular.isDefined(checklist.ClientDetails) && checklist.ClientDetails != null) {
                    if (angular.isDefined(checklist.ClientDetails.Sites)) {
                        delete checklist.ClientDetails.Sites;
                    }

                    if (angular.isDefined(checklist.ClientDetails.Contacts)) {
                        delete checklist.ClientDetails.Contacts;
                    }
                }

                callback(checklist);
            });
        };

        var getChecklistFromLocalStorage = function (checklistId, inflateQuestions) {
            inflateQuestions = (typeof inflateQuestions === "undefined") ? true : inflateQuestions;
            var checklist, completeSetOfQuestions;

            //get from local storage
            if ($window.localStorage["Checklist." + checklistId] != null) {
                checklist = JSON.parse($window.localStorage["Checklist." + checklistId]);

                //this is for safari. Safari will only parse the date string in the format 2013-11-20T15:06:08 if there is a trailing Z. WTF
                if (checklist.LastModifiedOn != null && checklist.LastModifiedOn.length == 19) {
                    checklist.LastModifiedOn += "Z";
                }

                //convert UTC string to date
                if (angular.isDefined(checklist.LastModifiedOn)) {
                    checklist.LastModifiedOn = new Date(checklist.LastModifiedOn);
                }

                //$rootScope.ChecklistLastSavedlocaly = checklist.LastModifiedOn.toJSON();

                getIndustryNameFromId(checklist);

                if (inflateQuestions && $window.localStorage["CompleteSetOfQuestions"] != null) {
                    completeSetOfQuestions = JSON.parse($window.localStorage["CompleteSetOfQuestions"]);
                    return inflateQuestionsWithTextAndResponses(completeSetOfQuestions, checklist);
                }


                return checklist;
            }
            return null;
        };

        function checklistMatches(accountnumber, siteId, checklistcreatedby, visitdate, checkliststatus, checklist) {
            var match = true;

            if (accountnumber != undefined && accountnumber != '') {
                if (angular.isDefined(checklist.ClientDetails) && checklist.ClientDetails.CAN.toUpperCase() != accountnumber.toUpperCase()) {
                    match = false;
                }
            }

            if (siteId != undefined && siteId != '') {
                if (angular.isDefined(checklist.SiteId) && checklist.Site.Id != siteId) {
                    match = false;
                }
            }

            if (checklistcreatedby != undefined && checklistcreatedby != '') {
                if (angular.isDefined(checklist.CreatedBy) && checklist.CreatedBy.toUpperCase() != checklistcreatedby.toUpperCase()) {
                    match = false;
                }
            }
            if (visitdate != undefined && visitdate != '') {

                var parts = visitdate.split("/");
                var d1 = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));

                var parts2 = checklist.SiteVisit.VisitDate.split("/");
                var d2 = new Date(Number(parts2[2]), Number(parts2[1]) - 1, Number(parts2[0]));

                if (d1 - d2 != 0) {
                    match = false;
                }
            }
            if (checkliststatus != undefined && checkliststatus != '') {
                if (angular.isDefined(checklist.Status) && checklist.Status.toUpperCase() != checkliststatus.toUpperCase()) {
                    match = false;
                }
            }
            return match;
        }

        function getSite(id, sites) {
            var site = {};
            $.each(sites, function (idx, item) {
                if (id == item.Id) {
                    site.Id = item.Id;
                    site.SiteName = item.SiteName;
                    site.Address1 = item.Address1;
                    site.Address2 = item.Address2;
                    site.Address3 = item.Address3;
                    site.Address4 = item.Address4;
                    site.Postcode = item.Postcode;
                }

            });
            return site;
        }

        function queryLocal(accountNumber, siteId, checklistCreatedBy, visitDate, checklistStatus) {
            var results = [];
            for (var key in $window.localStorage) {
                if (key.indexOf('Checklist.') > -1) {

                    var checklist = {};

                    try {
                        checkList = JSON.parse($window.localStorage.getItem(key));
                        if (checklistMatches(accountNumber, siteId, checklistCreatedBy, visitDate, checklistStatus, checkList)) {
                            var item = {
                                Id: checkList.Id,
                                CAN: angular.isDefined(checkList.ClientDetails) ? checkList.ClientDetails.CAN : "",
                                ClientName: angular.isDefined(checkList.ClientDetails) ? checkList.ClientDetails.CompanyName : "",
                                Site: angular.isDefined(checkList.Site) ? checkList.Site : null,
                                CreatedOn: checkList.CreatedOn,
                                CreatedBy: checkList.CreatedBy,
                                Status: checkList.Status,
                                VisitDate: checkList.SiteVisit.VisitDate,
                                Local: true
                            };
                            results.splice(results.length, 1, item);
                        }

                    } catch (e) {
                        console.log('unable to parse checklist ' + key);
                    }
                }
            }


            return results;
        }

        var query = function (accountNumber, checklistCreatedBy, visitDate, checklistStatus, includeDeleted, excludeSubmitted, statusFromDate, statusToDate, callback) {

            var results = [];
            if (includeDeleted == false) {
                results = queryLocal(accountNumber, null, checklistCreatedBy, visitDate, checklistStatus);
            }

            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "GET", url: config.apiUrl + 'checklistsquery' + '?clientAccountNumber=' + accountNumber + '&checklistCreatedBy=' + encodeURIComponent(checklistCreatedBy) + '&visitDate=' + visitDate + '&status=' + checklistStatus + '&includeDeleted=' + includeDeleted + '&excludeSubmitted=' + excludeSubmitted + '&statusFromDate=' + statusFromDate + '&statusToDate=' + statusToDate, withCredentials: true })
                    .success(function (data) {

                        if (results.length) { //if any locally stored checklists
                            for (var i = 0; i < results.length; i++) { // for each locally stored checklist
                                for (var j = data.length - 1; j >= 0; j--) { //for each checklist returned from server

                                    data[j].Local = false;

                                    if (results[i].Id == data[j].Id) {
                                        results[i].HasQaComments = data[j].HasQaComments;
                                        results[i].Status = data[j].Status;
                                        results[i].QaAdvisor = data[j].QaAdvisor;
                                        results[i].ExecutiveSummaryDocumentLibraryId = data[j].ExecutiveSummaryDocumentLibraryId;
                                        results[i].HasUnresolvedQaComments = data[j].HasUnresolvedQaComments;
                                        results[i].ExecutiveSummaryUpdateRequired = data[j].ExecutiveSummaryUpdateRequired;
                                        results[i].ExecutiveSummaryQACommentsResolved = data[j].ExecutiveSummaryQACommentsResolved;
                                        results[i].Favourite = data[j].Favourite;

                                        data.splice(j, 1);
                                    }
                                }
                            }

                            data = data.concat(results);
                        }

                        if (callback) {
                            callback(data);
                        } else {
                            return data;
                        }
                    }).error(function (data, status, headers) {
                        console.log('error getting checklist, getting from local storage ' + status);
                        if (callback) {
                            callback(results);
                        } else {
                            return results;
                        }
                    });
            }
            else {
                if (callback) {
                    callback(results);
                }
            }
        };

        var updatePDF = function (checklist) {
            $http({ method: "POST", url: config.apiUrl + 'reports/update/pdf/' + checklist.Id, data: checklist, withCredentials: true })
                .success(function () {
                    console.log('PDF updated on server');
                })
                .error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                });
        };



        var saveIt = function (checklist) {
            console.log('save called');
            var deferred = $q.defer();
            //save to local storage and the api

            var date = new Date();

            // convert to json to accomodate different browser standards for date parsing
            checklist.LastModifiedOn = date.toJSON();

            // IE FIX: AP/SGG 
            // For some reason, dates which have been converted to JSON format are reverted by IE.
            // This is a bodge to re-convert all dates to JSON format before saving
            // Should be fixed properly in the future ...
            if (!IsNullOrUndefined(checklist.SiteVisit.VisitDate)) {
                checklist.SiteVisit.VisitDate = ParseDate(checklist.SiteVisit.VisitDate).toJSON();
            }

            if (!IsNullOrUndefined(checklist.ClientDetails) && !IsNullOrUndefined(checklist.ClientDetails.CreatedOn)) {
                checklist.ClientDetails.CreatedOn = ParseDate(checklist.ClientDetails.CreatedOn).toJSON();
            }

            if (!IsNullOrUndefined(checklist.CreatedOn)) {
                checklist.CreatedOn = ParseDate(checklist.CreatedOn).toJSON();
            }

            if (!IsNullOrUndefined(checklist.LastModifiedOn)) {
                checklist.LastModifiedOn = ParseDate(checklist.LastModifiedOn).toJSON();
            }

            for (var i = 0; i < checklist.Questions.length; i++) {
                if (!IsNullOrUndefined(checklist.Questions[i].Answer) && !IsNullOrUndefined(checklist.Questions[i].Answer.SupportingDocumentationDate)) {
                    checklist.Questions[i].Answer.SupportingDocumentationDate = ParseDate(checklist.Questions[i].Answer.SupportingDocumentationDate).toJSON();
                }
            }

            if (checklist.Status == "Draft") {
                //checklist.LastModifiedOn = date.toUTCString();
                saveToLocalStorage(checklist);

                //var lastLocalSave = checklist.LastSavedLocaly;
            }

            if ($rootScope.isOnlineAndWorkingOnline($window)) {

                //remove question fields from payload to reduce the size when saving to the server
                var checklistCopy = angular.copy(checklist);

                if (checklistCopy.Status != "Submitted") { //the submit checklist process needs the full model to produce the PDF
                    angular.forEach(checklistCopy.Questions, function (value, index) {
                        if (value.Question.CustomQuestion == undefined || value.Question.CustomQuestion == null || value.Question.CustomQuestion == false) {
                            delete value.Question.Text;
                            delete value.Question.PossibleResponses;
                            delete value.Question.Category;
                            delete value.Question.Mandatory;
                            delete value.Question.GuidanceNotes;
                            delete value.Question.SpecificToClientId;
                        }
                    });
                }


                $http({ method: "POST", url: config.apiUrl + 'checklists/' + checklist.Id, data: checklistCopy, withCredentials: true })
                    .success(function (data) {
                        console.log('checklists saved to server');

                        saveServerSyncStatus(checklist.Id, ParseDate(data.LastModifiedOn).toJSON());
                        var syncStatus = getSyncStatus(checklist.Id);

                        deferred.resolve({
                            success: true,
                            deletedOnServer: data.ChecklistMarkedAsDeletedOnServer,
                            msg: checklist.Status + ' checklist successfully saved.',
                            LastLocalSave: syncStatus.LastLocalSave,
                            LastServerSave: syncStatus.LastServerSave,
                            ChecklistSavedToServer: true
                        });

                        if (checklist.Status != 'Draft') {
                            $window.localStorage.removeItem(["Checklist." + checklist.Id]);
                            $window.localStorage.removeItem(["Employees:" + checklist.ClientId]);
                            $window.localStorage.removeItem([checklist.Id + ".syncStatus"]);
                        }                       
                    })
                    .error(function (data, status, headers, config) {
                        console.log('unable save checklist to server');
                        console.log(data);
                        var syncStatus = getSyncStatus(checklist.Id);
                        if (status == 500) {
                            deferred.resolve({
                                success: false,
                                msg: 'An error has occurred.  Unable to save ' + checklist.Status + ' checklist to server.',
                                LastLocalSave: syncStatus.LastLocalSave,
                                LastServerSave: syncStatus.LastServerSave,
                                ChecklistSavedToServer: false
                            });
                        }
                        else if (status == 403) {
                            deferred.resolve({
                                success: false,
                                msg: 'Unable to update this checklist. Changes to submitted checklists are not allowed.',
                                LastLocalSave: syncStatus.LastLocalSave,
                                LastServerSave: syncStatus.LastServerSave,
                                ChecklistSavedToServer: false
                            });
                        }
                        else {
                            deferred.resolve({
                                success: false,
                                msg: 'Unable to save ' + checklist.Status + ' checklist to server. Please ensure you are online and try again.',
                                LastLocalSave: syncStatus.LastLocalSave,
                                LastServerSave: syncStatus.LastServerSave,
                                ChecklistSavedToServer: false
                            });
                        }
                        //checklist.LastModifiedOn = date.toUTCString();

                        if (status != 403 && checklist.Status == "Draft") {
                            saveToLocalStorage(checklist);
                        }
                    });
            }
            else {
                $timeout( function () {
                    var syncStatus = getSyncStatus(checklist.Id);
                    if (checklist.Status == 'Draft') {
                        deferred.resolve({
                            success: true,
                            msg: "",
                            LastLocalSave: syncStatus.LastLocalSave,
                            LastServerSave: syncStatus.LastServerSave,
                            ChecklistSavedToServer: false
                        });
                    }
                    else {
                        deferred.resolve({
                            success: false,
                            msg: "Unable to save checklist. Please ensure you are online and try again.",
                            LastLocalSave: syncStatus.LastLocalSave,
                            LastServerSave: syncStatus.LastServerSave,
                            ChecklistSavedToServer: false
                        });
                    }
                }, 20); //.then(null);
            }

            return deferred.promise;
        };

        var create = function (clientId, siteId, visitDate, visitBy, user, Jurisdiction) {
            var d = new Date();
            var createdBy = user == undefined ? "" : user.fullname();

            return {
                "Id": guid(),
                "SiteId": siteId,
                "ClientId": clientId,
                "Submit": false,
                "CoveringLetterContent": '',
                "Categories": [],
                "ImmediateRiskNotifications": [],
                "Questions": [],
                "SiteVisit": {
                    "VisitBy": visitBy,
                    "VisitDate": visitDate,
                    "PersonSeen": {}
                },
                "Status": 'Draft',
                "CreatedOn": d,
                "CreatedBy": createdBy,
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "Jurisdiction": Jurisdiction
            };
        };

        var getByClientId = function (clientId, callback) {
            var checklists = getChecklistFromLocalStorageByClientId(clientId);

            $http({ method: "GET", url: config.apiUrl + 'clients/' + clientId + '/checklists', withCredentials: true }).success(function (data) {
                if (callback) {
                    callback(data);

                    $.each(checklists, function (index, checklist) {
                        data.push(checklist);
                    });
                }
            }).error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        };

        var addQuestions = function (checklist, questions) {
            var addStandardQuestion = function (questionObject) {
                var doesExists = doesQuestionExistQuestionAnswerArray(checklist.Questions, questionObject.Id);
                if (!doesExists) {
                    //convert to question answer
                    var questionAnswer = {
                        "Question": questionObject,
                        "Answer": {
                            "Id": null,
                            "SelectedResponseId": null,
                            "Comment": "",
                            "QuestionId": questionObject.Id
                        }
                    };

                    checklist.Questions.push(questionAnswer);
                    if (!doesCategoryExistInCategoriesArray(checklist.Categories, questionObject.Category.Id)) {
                        questionObject.Category.hasQaComments = true;
                        checklist.Categories.push(questionObject.Category);
                    }
                }
            };

            var doesQuestionExistQuestionAnswerArray = function (questionAnswerArray, questionId) {
                var doesExists = false;
                $.each(questionAnswerArray, function (index, questionAnswer) {
                    if (questionAnswer.Question.Id == questionId) {
                        doesExists = true;
                        return;
                    }
                });

                return doesExists;
            };

            var doesCategoryExistInCategoriesArray = function (categoriesArray, categoryId) {
                var doesExists = false;
                $.each(categoriesArray, function (index, category) {
                    if (category.Id == categoryId) {
                        doesExists = true;
                        return;
                    }
                });
                return doesExists;
            };

            var orderedQuestions = $filter('orderBy')(questions, 'OrderNumber');

            $.each(orderedQuestions, function (idx, question) {
                addStandardQuestion(question);
            });


            updateQuestionNumbers(checklist);

            return checklist;

        };

        var updateQuestionNumbers = function (checklist) {
            var orderedCategories = $filter('orderBy')(checklist.Categories, 'OrderNumber');

            $.each(orderedCategories, function (idx, category) {

                var categoryQuestions = $filter('filter')(checklist.Questions, { "Question.CategoryId": category.Id });

                $.each(categoryQuestions, function (idx2, categoryQuestion) {
                    categoryQuestion.QuestionNumber = idx2 + 1;
                    categoryQuestion.CategoryNumber = idx + 1;
                });

            });
        };

        var addRecordIRN = function (checklist, recordIRN) {
            var createRecordIRN = {
                "Id": recordIRN.Id,
                "Reference": recordIRN.Reference,
                "Title": recordIRN.Title,
                "SignificantHazard": recordIRN.SignificantHazard,
                "RecommendedImmediate": recordIRN.RecommendedImmediate
            };

            checklist.ImmediateRiskNotifications.push(createRecordIRN);

            return checklist;

        };

        var saveToLocalStorage = function (checklist) {

            var checklistCopy = angular.copy(checklist);

            angular.forEach(checklistCopy.Questions, function (value, index) {
                if (value.Question.CustomQuestion == undefined || value.Question.CustomQuestion == null || value.Question.CustomQuestion == false) {
                    delete value.Question.Text;
                    delete value.Question.PossibleResponses;
                    delete value.Question.Category;
                    delete value.Question.Mandatory;
                    delete value.Question.GuidanceNotes;
                    delete value.Question.SpecificToClientId;
                }
            });

            try {

                $window.localStorage["Checklist." + checklistCopy.Id] = JSON.stringify(checklistCopy);
                if (angular.isDefined(checklist.LastModifiedOn) && checklist.LastModifiedOn != null) {
                    saveLocalSyncStatus(checklistCopy.Id, ParseDate(checklist.LastModifiedOn).toJSON());
                }
            }
            catch (e) {
                if (e instanceof DOMException) {
                    if (e.code == 22 /*QUOTA_EXCEEDED_ERR*/) {
                        alert("Your local memory is full, please upload locally stored reports to the server");
                        return false;
                    }
                    else {
                        throw e;
                    }
                } else {
                    throw e;
                }

            }

            //Time tracking of saving checklist to localstorage
            //$rootScope.ChecklistLastSavedlocaly = new Date().toJSON();
            //$rootScope.ChecklistLastSavedlocaly = ParseDate(checklistCopy.LastModifiedOn).toJSON();

            return true;
        };


        var inflateQuestionsWithTextAndResponses = function (completeSetOfQuestions, checklist) {
            angular.forEach(checklist.Questions, function (value, index) {
                if (value.Question.CustomQuestion == undefined || value.Question.CustomQuestion == null || value.Question.CustomQuestion == false) {
                    var question = getQuestionsByQuestionId(completeSetOfQuestions, value.Question.Id);
                    if (question != null) {
                        value.Question = question;
                    }
                }
            });

            return checklist;
        };


        var _getDistinctCreatedByFromLocalStorage = function () {
            if ($window.localStorage.getItem("Consultants") != null) {
                return JSON.parse($window.localStorage.getItem('Consultants'));
            }

            return null;
        }

        var getDistinctCreatedBy = function (callback) {
            var consultants = [];
            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "GET", url: config.apiUrl + 'checklist/getdistinctcreatedby', withCredentials: true }).success(function (data) {
                    $window.localStorage.setItem('Consultants', JSON.stringify(data));
                    callback(data);

                }).error(function (data, status, headers) {
                    console.log('error distinctCreatedBy ' + status);
                    consultants = _getDistinctCreatedByFromLocalStorage();
                    callback(consultants);
                });
            }
            else {
                consultants = _getDistinctCreatedByFromLocalStorage();
                callback(consultants);
            }

        };

        var uploadChecklistAndRemoveFromLocalStorage = function (checklistId) {

            var deferred = $q.defer();
            var checklist = getChecklistFromLocalStorage(checklistId);

            if (checklist != null) {
                var promise = saveIt(checklist);

                if (promise != undefined) {
                    promise.then(function (result) {

                        if (result.success) {
                            if (result.ChecklistSavedToServer == true) 
                            {
                                $window.localStorage.removeItem("Checklist." + checklistId);
                                $window.localStorage.removeItem([checklistId + ".syncStatus"]); //removes the associated sync status as well if any.
                                deferred.resolve({ success: true });
                            }
                            else {
                                // handle potential issue with losing online connection during save.
                                deferred.resolve({ success: false, msg: 'Upload failed. Please try again.' }); 
                            }
                        }
                        else
                        {
                            deferred.resolve({ success: false, msg: result.msg });
                        }
                    });
                }
            }
            return deferred.promise;
        };

        var assignChecklistToQaAdvisor = function (checklistId, qaAdvisor) {
            var deferred = $q.defer();
            $http({ method: "POST", url: config.apiUrl + 'checklist/' + checklistId + '/AssignChecklistToQaAdvisor', data: qaAdvisor, withCredentials: true }).
                success(function () {
                    deferred.resolve({ success: true, msg: 'Advisor successfully assigned to checklist.' });
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to assign advisor to checklist.' });
                    }
                    else {
                        deferred.resolve({ success: false, msg: 'Unable to assign advisor to checklist. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var deleteChecklistFromServer = function (checklistId, successCallback, notFoundOnServerCallback, otherErrorCallback) {
            $http(
                {
                    method: "POST",
                    url: config.apiUrl + 'deletechecklist/' + checklistId,
                    data: checklistId,
                    withCredentials: true
                }
            ).success(function (data) {

                console.log('checklist deleted from server');
                if (successCallback) {
                    successCallback(data);
                    $window.localStorage.removeItem(["Checklist." + checklistId]);
                    $window.localStorage.removeItem([checklistId + ".syncStatus"]); //removes the associated sync status as well if any.
                } else {
                    return data;
                }
            }).error(function (data, status, headers, config) {

                if (data == '"Checklist not found."') {
                    console.log('checklist not on server');
                    if (notFoundOnServerCallback) {
                        notFoundOnServerCallback();
                    }
                    return;
                }

                console.log('unable to contact server');
                if (otherErrorCallback) {
                    otherErrorCallback();
                }
            });
        };

        var sendUpdateRequireEmailNotification = function (checklistId) {
            var deferred = $q.defer();
            $http({ method: "POST", url: config.apiUrl + 'updaterequirenotification/checklist/' + checklistId }).
                success(function () {
                    deferred.resolve({ success: true, msg: 'email notification sent to the user.' });
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to send email notification to the user' });
                    }
                    else {
                        deferred.resolve({ success: false, msg: 'Unable to send email notification to the user. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var sendChecklistCompletedNotification = function (checklistId) {
            var deferred = $q.defer();
            $http({ method: "POST", url: config.apiUrl + 'checklists/SendChecklistCompleteEmailNotification/' + checklistId }).
                success(function () {
                    deferred.resolve({ success: true, msg: 'completed checklist email notification sent to the QA.' });
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to send completed checklist email notification to the QA' });
                    } else {
                        deferred.resolve({ success: false, msg: 'Unable to send completed checklist email notification to the QA. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var getIndustryNameFromId = function (checklist) {
            // Look up industry title
            if (checklist.IndustryId != undefined && (!angular.isDefined(checklist.Industry) || isNullOrEmptyString(checklist.Industry))) {

                ChecklistTemplateService.getTemplateName(checklist.IndustryId, function (result) {
                    if (result != undefined) {
                        checklist.Industry = result;
                    }
                });
            }
        };

        var copyAndCreateNewChecklistWithoutResponses = function (checklistId, siteId, clientId) {
            var siteIds = [siteId];
            
            var deferred = $q.defer();
            $http({ method: "POST", url: config.apiUrl + 'checklist/' + checklistId + '/copywithoutresponses/' + clientId + '/false', data: siteIds, withCredentials: true }).
                success(function (result) {
                    deferred.resolve({ success: true, data: result, msg: 'checklist copied successfully.' });
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to copy checklist.' });
                    }
                    else {
                        deferred.resolve({ success: false, msg: 'Unable to copy checklist. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var cloneReport = function (checklistId, selectedSiteIDs, clientId, withResponses) {
            var siteIds = selectedSiteIDs;

            var deferred = $q.defer();

            var apiURL = config.apiUrl + 'checklist/' + checklistId;

            if (withResponses) {
                apiURL += '/copywithresponses';
            }
            else {
                apiURL += '/copywithoutresponses';
            }

            apiURL += '/' + clientId + '/true';
            
            $http({ method: "POST",
                url: apiURL,
                data: siteIds,
                withCredentials: true
            })
                .success(function (result) {
                    deferred.resolve({ success: true, data: result, msg: 'checklist cloned successfully.' });
                })
                .error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to clone checklist.' });
                    }
                    else {
                        deferred.resolve({ success: false, msg: 'Unable to clone checklist. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var copyAndCreateNewChecklistWithResponses = function (checklistId, siteId, clientId) {
            var siteIds = [siteId];

            var deferred = $q.defer();
            $http({ method: "POST", url: config.apiUrl + 'checklist/' + checklistId + '/copywithresponses/' + clientId + '/false', data: siteIds, withCredentials: true }).
                success(function (result) {
                    deferred.resolve({ success: true, data: result, msg: 'checklist copied successfully.' });
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to copy checklist.' });
                    }
                    else {
                        deferred.resolve({ success: false, msg: 'Unable to copy checklist. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var getDraftsFromLocalStorage = function () {
            var results = [];
            for (var key in $window.localStorage) {
                if (key.indexOf('Checklist.') > -1) {

                    var localChecklist = {};

                    try {
                        localChecklist = JSON.parse($window.localStorage.getItem(key));

                        if (localChecklist.Status != undefined && localChecklist.Status.toUpperCase() == 'DRAFT') {
                            var item = {
                                Id: localChecklist.Id,
                                CAN: angular.isDefined(localChecklist.ClientDetails) ? localChecklist.ClientDetails.CAN : "",
                                ClientName: angular.isDefined(localChecklist.ClientDetails) ? localChecklist.ClientDetails.CompanyName : "",
                                Site: angular.isDefined(localChecklist.Site) ? localChecklist.Site : null,
                                CreatedOn: localChecklist.CreatedOn,
                                CreatedBy: localChecklist.CreatedBy,
                                Status: localChecklist.Status,
                                VisitDate: localChecklist.SiteVisit.VisitDate,
                                Deleted: false
                            };
                            results.splice(results.length, 1, item);
                        }

                    } catch (e) {
                        console.log('getDraftsFromLocalStorage: unable to parse checklist ' + key);
                    }
                }
            }
            return results;
        };

        var deleteChecklistFromLocalStorage = function (checklistId) {
            var deferred = $q.defer();
            var key = "Checklist." + checklistId;

            $window.localStorage.removeItem([key]);
            $window.localStorage.removeItem([checklistId + ".syncStatus"]); //removes the associated sync status as well if any.

            var checklist = $window.localStorage.getItem([key]);

            if (IsNullOrUndefined(checklist)) {
                deferred.resolve({ success: true, data: checklistId });
            } else {
                deferred.resolve({ success: false, data: checklistId });
            }
            return deferred.promise;
        };

        var markChecklistAsFavourite = function (checklistId, title) {
            var deferred = $q.defer();
            var request = { "ChecklistId": checklistId, "Title": title };
            $http({ method: "POST", url: config.apiUrl + 'checklist/' + checklistId + '/markchecklistfavourite/', data: request, withCredentials: true }).
                success(function (result) {
                    deferred.resolve({ success: true, data: result, msg: 'Checklist has been marked as favourite.' });
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to mark checklist as favourite.' });
                    }
                    else {
                        deferred.resolve({ success: false, msg: 'Unable to mark checklist as favourite. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var unMarkChecklistAsFavourite = function (checklistId) {
            var deferred = $q.defer();

            $http({ method: "POST", url: config.apiUrl + 'checklist/' + checklistId + '/unmarkchecklistfavourite/', withCredentials: true }).
                success(function (result) {
                    deferred.resolve({ success: true, data: result, msg: 'Checklist has been unmarked as favourite.' });
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to unmark checklist as favourite.' });
                    }
                    else {
                        deferred.resolve({ success: false, msg: 'Unable to unmark checklist as favourite. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var updateLocalChecklistWithFavourite = function (checklistId, favourite) {
            var localChecklist = JSON.parse($window.localStorage.getItem(["Checklist." + checklistId]));
            if (angular.isDefined(localChecklist) && localChecklist != null) {
                localChecklist.Favourite = favourite;
                $window.localStorage.setItem("Checklist." + checklistId, JSON.stringify(localChecklist));
            }
        };

        var searchFavouriteChecklists = function (callback) {
            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "GET", url: config.apiUrl + 'checklist/searchfavouritechecklists', withCredentials: true }).success(function (data) {
                    callback(data);
                }).error(function (data, status) {
                    console.log('error searchFavouriteChecklists ' + status);
                    callback(null);
                });
            }
        };

        var restoreDeletedChecklist = function (checklistId, callback) {
            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "POST", url: config.apiUrl + 'checklist/' + checklistId + '/restoredeletedchecklist', withCredentials: true })
                    .success(function (data) {
                        console.log('deleted checklist restored on server');
                        callback(data);
                    })
                    .error(function (data, status) {
                        console.log('error restoring deleted checklist - ' + status);
                        callback(null);
                    });
            }
        };
        //var saveSyncStatus = function(checklistId, lastlocalSave, lastServerSave) {
        //    var key = checklistId + '.syncStatus';
        //    var syncStatus = { "LastLocalSave": lastlocalSave, "LastServerSave": lastServerSave };
        //    $window.localStorage[key] =  JSON.stringify(syncStatus);
        //};

        var saveSyncStatus = function (checklistSyncStatus) {
            var key = checklistSyncStatus.ChecklistId + '.syncStatus';
            $window.localStorage[key] = JSON.stringify(checklistSyncStatus);
        };

        var saveLocalSyncStatus = function (checklistId, lastlocalSave) {
            var syncStatus = getSyncStatus(checklistId);
            syncStatus.LastLocalSave = lastlocalSave;
            saveSyncStatus(syncStatus);
        };

        var saveServerSyncStatus = function (checklistId, lastServerSave) {
            var syncStatus = getSyncStatus(checklistId);
            syncStatus.LastServerSave = lastServerSave;
            saveSyncStatus(syncStatus);
        };


        var getSyncStatus = function (checklistId) {
            var key = checklistId + '.syncStatus';
            var syncStatus = { "ChecklistId": checklistId, "LastLocalSave": null, "LastServerSave": null };

            if ($window.localStorage[key] != null) {
                return JSON.parse($window.localStorage[key]);
            } else {
                return syncStatus;
            }
        };

        var revertChecklist = function (checklistId) {

            var deferred = $q.defer();

            var apiURL = config.apiUrl + 'checklist/' + checklistId + '/revertchecklist';

            $http({
                method: "POST",
                url: apiURL,
                withCredentials: true
            })
                .success(function (result) {
                    deferred.resolve({ success: true, data: result, msg: '' });
                })
                .error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    if (status == 500) {
                        deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to revert checklist.' });
                    }
                    else {
                        deferred.resolve({ success: false, msg: 'Unable to revert checklist. Please ensure you are online and try again.' });
                    }
                });

            return deferred.promise;
        };

        var showInformationDialog = function (title, body) {

            var confirmDialog = $modal.open({
                windowClass: "modal",
                templateUrl: 'angular/partials/maintenance/confirmDialog.htm',
                controller: informationDialogController,
                resolve: {
                    options: function () {
                        return {
                            'title': title,
                            'prompt': body,
                            'ok': 'OK',
                            'cancel': ''
                        };
                    }
                }
            });
        };

        return {
            get: get,
            getFromServer: getFromServer,
            query: query,
            queryLocal: queryLocal,
            save: saveIt,
            create: create,
            getByClientId: getByClientId,
            addQuestions: addQuestions,
            updateQuestionNumbers: updateQuestionNumbers,
            addRecordIRN: addRecordIRN,
            saveToLocalStorage: saveToLocalStorage,
            retrieveFromLocalStorage: getChecklistFromLocalStorage,
            inflateQuestionsWithTextAndResponses: inflateQuestionsWithTextAndResponses,
            getDistinctCreatedBy: getDistinctCreatedBy,
            uploadLocalChecklistAndRemove: uploadChecklistAndRemoveFromLocalStorage,
            assignChecklistToQaAdvisor: assignChecklistToQaAdvisor,
            deleteChecklistFromServer: deleteChecklistFromServer,
            sendUpdateRequireEmailNotification: sendUpdateRequireEmailNotification,
            sendChecklistCompletedNotification: sendChecklistCompletedNotification,
            getQuestionsByQuestionsArrayId: getQuestionsByQuestionsArrayId,
            updatePDF: updatePDF,
            copyAndCreateNewChecklistWithoutResponses: copyAndCreateNewChecklistWithoutResponses,
            copyAndCreateNewChecklistWithResponses: copyAndCreateNewChecklistWithResponses,
            cloneReport: cloneReport,
            getDraftsFromLocalStorage: getDraftsFromLocalStorage,
            deleteChecklistFromLocalStorage: deleteChecklistFromLocalStorage,
            markChecklistAsFavourite: markChecklistAsFavourite,
            unMarkChecklistAsFavourite: unMarkChecklistAsFavourite,
            updateLocalChecklistWithFavourite: updateLocalChecklistWithFavourite,
            searchFavouriteChecklists: searchFavouriteChecklists,
            getSyncStatus: getSyncStatus,
            revertChecklist: revertChecklist,
            showInformationDialog: showInformationDialog
        };

    });


