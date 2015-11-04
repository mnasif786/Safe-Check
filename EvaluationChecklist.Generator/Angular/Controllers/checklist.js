function ChecklistController($rootScope, $scope, $routeParams, $modal, $location, $timeout, $window, $anchorScroll, QuestionService, ChecklistService, TemplateService, ImpressionTypeService, ExecutiveSummaryService, ConfigService, $filter, ClientEmployeeService, AccountService) {
    console.log('ChecklistController start');

    //this function is used to update the scope when the letter has been saved in another browser window
    //we have tried to do this using scope apply but is doesn't work so we have to access the value of the hidden input box in the controller
    //its messy but we've tried other ways but it just doesn't work
    $scope.saveLetterContent = function () {
        $scope.Checklist.CoveringLetterContent = $("#coveringLetterContent").val();
        $scope.IsDirty = true;
        $scope.save();
    };

    $scope.templates = TemplateService.getTemplates();

    $scope.checkedQuestionList = [];
    $scope.mandatoryQuestionList = [];
    $scope.checked = false;
    $scope.isTemplateSelected = false;
    $scope.letterTile = [];
    $scope.activeTab = "";
    $scope.hideNotApplicableQuestionResponses = false;
    $scope.hideAcceptableQuestionsRepsonses = false;
    $scope.showAlertOnSave = false;
    $scope.readyToSubmit = false;
    $scope.checklistFirstComplete = true;
    $scope.IsDirty = false;
    $scope.checklistToPrint = null;
    $scope.readonly = false;
    $scope.editDataEnabled = false;

    $scope.Templates = ExecutiveSummaryService.getTemplates();

   
    
    $scope.PDFDownloadUrl = function() {
        return ConfigService.getConfig().apiUrl + "reports/actionplan/pdf";
    };

    $scope.ActionPlanPDFDownloadUrl = function() {
        return ConfigService.getConfig().apiUrl + "reports/actionplanpdf";
    };
    
    $scope.AllQuestionsTemplatePDFDownloadUrl = function() {
        return ConfigService.getConfig().apiUrl + "reports/allquestions/pdf";
    };

    var LoadChecklist = function() {
        $rootScope.blockUI();
        ChecklistService.get($routeParams.Id, function(data) {
            if (!$.isEmptyObject(data)) {

                angular.forEach(data.Questions, function(questionAnswer) {
                    if (questionAnswer.Answer.SelectedResponseId != null && !angular.isDefined(questionAnswer.Answer.Response)) {
                        var answerResponses = $filter('filter')(questionAnswer.Question.PossibleResponses, { "Id": questionAnswer.Answer.SelectedResponseId }, true);

                        if (answerResponses.length > 0) {
                            questionAnswer.Answer.Response = answerResponses[0];
                        }
                    }
                });

                loadSpecialReportTemplates(data);
                LoadImpressionTypes(data);
                LoadEmployees(data.ClientId);
                LoadReportLetterCategories();

                if (angular.isDefined($scope.user)) {
                    data.PostedBy = $scope.user.fullname();
                    data.PostedByEmailAddress = $scope.user.email;
                }
                $scope.Checklist = data;
                $scope.ExecutiveSummarySignedOff = $scope.isExecSummarySignedOff();
                $scope.updateSubmitStatus();

                console.log($scope.Checklist.Jurisdiction);

                $scope.readonly = data.Status == 'Submitted';

                $scope.IsDirty = false;
                $scope.$watch('Checklist', function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        $scope.IsDirty = true;
                    }

                }, true);

                var syncStatus = ChecklistService.getSyncStatus($scope.Checklist.Id);
                $rootScope.ChecklistLastSuccessfullySavedToServer = syncStatus.LastServerSave;
                $rootScope.ChecklistLastSavedlocaly = syncStatus.LastLocalSave;
                
                $rootScope.unblockUI();
            } else {
                $rootScope.unblockUI();
                $location.path("reportsummary");
            }
        });
    };

    $scope.filterAnswerNoResponse = function() {
        var listOfAnswerNoResponse = [];
        var index = 0;
        for (var j = 0; j < $scope.mandatoryQuestions.length; j++) {
            if ($scope.mandatoryQuestions[j].Flag == false) {
                index++;
                listOfAnswerNoResponse.push({
                    Id: index,
                    Text: $scope.mandatoryQuestions[j].Text
                    // CategoryId:  mandatoryQuestions[j].Text,CategoryId
                });

            }
        }
        return listOfAnswerNoResponse;
    };

    var showUnansweredQuestions = function(unansweredQuestions) {

        var modalInstance = $modal.open({
            windowClass: "modal scroll",
            templateUrl: 'angular/partials/showmandatoryquestion.htm',
            controller: ShowUnansweredQuestionsController,
            resolve: {
                listOfAnswerNoResponse: function() {

                    return unansweredQuestions;
                },
                categories: function() {
                    return $scope.Checklist.Categories;
                }
            }
        });

        modalInstance.result.then(function() {
            //OK clicked.
        }, function() {
            //Cancel clicked.
        });
    };

    var showInformationDialog = function(title, body) {

        var confirmDialog = $modal.open({
            windowClass: "modal",
            templateUrl: 'angular/partials/maintenance/confirmDialog.htm',
            controller: informationDialogController,
            resolve: {
                options: function() {
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

    var showYesNoDialog = function(title, body, yesFunction, noFunction) {

        var confirmDialog = $modal.open({
            scope: $scope,
            windowClass: "modal small",
            templateUrl: 'angular/partials/maintenance/confirmDialog.htm',
            controller: yesNoDialogController,
            resolve: {
                options: function() {
                    return {
                        'title': title,
                        'prompt': body
                    };
                }
            }
        });

        confirmDialog.result.then(yesFunction, noFunction);
    };

    var loadSpecialReportTemplates = function (checklist) {

        if (checklist.SpecialReport) {

            $scope.Templates = $filter('filter')($scope.Templates, { "SpecialReport": true }, true);

            switch (checklist.Jurisdiction) {
                case 'UK':
                    $scope.Templates = $filter('filter')($scope.Templates, { "Id": "SpecialReportGB" }, true);
                    break;
                case 'ROI':
                    $scope.Templates = $filter('filter')($scope.Templates, { "Id": "SpecialReportROI" }, true);
                    break;
                case 'NI':
                    $scope.Templates = $filter('filter')($scope.Templates, { "Id": "SpecialReportNI" }, true);
                    break;
                default:
                    $scope.Templates = $filter('filter')($scope.Templates, { "Id": "SpecialReportGB" }, true);
            }

            $scope.selectedTemplate = $scope.Templates[0];
            $scope.isTemplateSelected = true;
        } else {
            $scope.Templates = $filter('filter')($scope.Templates, { "SpecialReport": false }, true);

        }
    }


    var LoadImpressionTypes = function(checklist) {
        ImpressionTypeService.get(function(data) {
            $scope.ImpressionTypes = [];
            $scope.ImpressionTypes = data;

            $scope.ImpressionTypes.splice(0, 0, { Id: emptyGuid(), Title: "-- Select Impression --" });

            //sets the default if null or undefined
            if (checklist.SiteVisit == undefined) {
                checklist.SiteVisit = { "SelectedImpressionType": null };
            }

            if (checklist.SiteVisit.SelectedImpressionType == undefined) {
                checklist.SiteVisit.SelectedImpressionType = $scope.ImpressionTypes[0];
            }

            if (checklist.SiteVisit.SelectedImpressionType != undefined && $scope.ImpressionTypes != undefined) {
                for (var i = 0; i < $scope.ImpressionTypes.length; i++) {
                    if ($scope.ImpressionTypes[i].Id == checklist.SiteVisit.SelectedImpressionType.Id && checklist.SiteVisit.SelectedImpressionType.Id != emptyGuid()) {
                        checklist.SiteVisit.SelectedImpressionType = $scope.ImpressionTypes[i];
                        break;
                    }
                }
            }
        });
    };
    
    var LoadReportLetterCategories = function() {
        QuestionService.getHeadings();
    };

    var LoadEmployees = function(clientId) {
        ClientEmployeeService.get(clientId, function(data) {
            if (data.length >= 0) {
                data.splice(data.length, 0, {
                    Id: emptyGuid(),
                    FullName: "-- Not Listed --",
                    EmailAddress: ""
                });
            }
            $scope.ClientEmployees = data;

        });
    };

    var postChecklistRequests = 0;
    $rootScope.postChecklistInProgress = false;

    var processPostChecklistQueue = function() {
        if (postChecklistRequests > 0 && $rootScope.postChecklistInProgress == false) {
            $rootScope.postChecklistInProgress = true;

            var promise = ChecklistService.save($scope.Checklist);
            if (promise != undefined) {
                promise.then(function(result) {

                    postChecklistRequests -= 1;
                    $rootScope.postChecklistInProgress = false;
                    
                    if (result.success == false) {
                        $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg}];
                    } else {
                        if ($scope.showAlertOnSave) 
                        {                        
                            var message = result.ChecklistSavedToServer ?
                                'Checklist has been successfully saved to Server. ' + $filter('date')(result.LastServerSave, 'yyyy/MM/dd HH:mm:ss') :
                                'Checklist has been successfully saved to Local Storage. ' + $filter('date')(result.LastLocalSave, 'yyyy/MM/dd HH:mm:ss');
                            $scope.showSaveAlert(message);
                        }
                    }
                    $rootScope.ChecklistLastSuccessfullySavedToServer = result.LastServerSave;
                    $rootScope.ChecklistLastSavedlocaly = result.LastLocalSave;
                });

            } else {
                postChecklistRequests -= 1;
                $rootScope.postChecklistInProgress = false;
            }
        }

        setTimeout(processPostChecklistQueue, 100);
    };

    setTimeout(processPostChecklistQueue, 100);

    $scope.save = function(showAlert) {

        $scope.editDataEnabled = false;

        $scope.showAlertOnSave = angular.isDefined(showAlert) ? showAlert : false;

        //copy the select site and set siteid
        if ($scope.Checklist.ClientDetails != undefined) {
            $scope.Checklist.ClientId = $scope.Checklist.ClientDetails.Id;
        }

        if (angular.isDefined($scope.selectedTemplate)) {
            $scope.letterTemplate = $scope.selectedTemplate.Title;
        }

        ////$scope.lastSavedDate = new Date();

        //we only want one save command to run at a time to prevent duplication of questions. 
        //There is no need to have more than two pending saves. One for the current save operation and one to issue the save command again.
        //The save method will always save scope.checklist, not a copy of scope.checklist.
        if (postChecklistRequests < 2 && ($scope.IsDirty || isLocalVersionLatestThanServerVersion())) {
            postChecklistRequests += 1;
        }

    };

    var isLocalVersionLatestThanServerVersion = function() {
        var syncStatus = ChecklistService.getSyncStatus($scope.Checklist.Id);
        if (syncStatus.LastLocalSave != null && syncStatus.LastServerSave != null &&
        (ParseDate(syncStatus.LastLocalSave).getTime() > ParseDate(syncStatus.LastServerSave).getTime())) {
            return true;
        }
        return false;
    }

    $scope.templateChanged = function() {
        if ($scope.selectedTemplate != null) {
            $scope.isTemplateSelected = true;
            $scope.Checklist.ReportHeaderType = $scope.selectedTemplate.HeaderType;

            $scope.Checklist.IncludeActionPlan = $scope.selectedTemplate.IncludeActionPlan;
            $scope.Checklist.IncludeComplianceReview = $scope.selectedTemplate.IncludeComplianceReview;
        } else {
            $scope.isTemplateSelected = false;
            $scope.Checklist.ReportHeaderType = '';
            $scope.Checklist.IncludeActionPlan = true;
            $scope.Checklist.IncludeComplianceReview = true;
        }
    };

    $scope.deleteTemplateLetter = function() {
        console.log('deleteLetterConfirmation called');

        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/deleteletterconfirmation.htm',
            controller: DeleteLetterConfirmationController,
            resolve: {
                something: 'what'
            }
        });

        modalInstance.result.then(function() {
            $scope.Checklist.CoveringLetterContent = "";
            $scope.letterTemplate = "";
            $scope.isTemplateSelected = $scope.Checklist.SpecialReport ? true: false;
            $scope.save();

        }, function() {
            //Cancel clicked.
        });
    };

    var executiveSummaryEditorWindow;

    var openExecutiveSummaryEditorWindow = function() {
        if (executiveSummaryEditorWindow == null || executiveSummaryEditorWindow.closed) {
            var exeSummaryTemplateUrl = 'index.htm#/executivesummary/' + $routeParams.Id;
            executiveSummaryEditorWindow = $window.open(exeSummaryTemplateUrl, '_blank');
        }

        executiveSummaryEditorWindow.focus();
    };

    $scope.editTemplateLetter = function() {
        localStorage["viewLetterMode." + $routeParams.Id] = 0;
        openExecutiveSummaryEditorWindow();
    };

    $scope.viewTemplateLetter = function() {
        localStorage["viewLetterMode." + $routeParams.Id] = 1;
        openExecutiveSummaryEditorWindow();
    };

    $scope.generateTemplate = function() {

        if (!validateDetailsForExecSummary()) {
            return;
        }

        $scope.Checklist.ClientLogoFilename = $scope.selectedTemplate.ClientLogoFilename;
        $scope.Checklist.IncludeGuidanceNotes = $scope.selectedTemplate.IncludeGuidanceNotes;
        $scope.Checklist.ReportHeaderType = $scope.selectedTemplate.HeaderType;
        $scope.Checklist.IncludeActionPlan = $scope.selectedTemplate.IncludeActionPlan;
        $scope.Checklist.IncludeComplianceReview = $scope.selectedTemplate.IncludeComplianceReview;

        if (angular.isDefined($scope.user)) {
            $scope.Checklist.PostedBy = $scope.user.fullname();
            $scope.Checklist.PostedByEmailAddress = $scope.user.email;

            ChecklistService.save($scope.Checklist);
        }

        var exeSummaryTemplateUrl = "index.htm#/executivesummary/" + $routeParams.Id + "/" + $scope.selectedTemplate.Id;
        if (executiveSummaryEditorWindow == null || executiveSummaryEditorWindow.closed) {
            executiveSummaryEditorWindow = $window.open(exeSummaryTemplateUrl, '_blank');
        } else {
            executiveSummaryEditorWindow.location.path = exeSummaryTemplateUrl;
            executiveSummaryEditorWindow.location.reload();
        }

        executiveSummaryEditorWindow.focus();
    };

    var validateDetailsForExecSummary = function() {
        if ($scope.Checklist.EmailReportToOthers && (!angular.isDefined($scope.Checklist.OtherEmails) || $scope.Checklist.OtherEmails.length === 0)) {
            showInformationDialog('Other email address', '"Email report to others", has been selected but the additional emails addresses have not been entered.');
            return false;
        }

        return true;
    };

    $scope.saveAndContinue = function() {
        var elements = {
            activeHeader: 'div#tabQuestionsContent.tab-content>div.active',
            activeTab: 'ul.nav.nav-tabs.menu-tabs li.active'
        };

        $scope.save(false);

        var currentTab = $(elements.activeTab);
        var nextTab = $(elements.activeTab).next();

        $(currentTab).removeClass('active');
        $(nextTab).addClass('active');

        var nextTabTitle = $(nextTab).find("a").text();
        var currentHeader = $(elements.activeHeader);
        var nextHeader = $(elements.activeHeader).next();

        $(currentHeader).removeClass('active');
        $(nextHeader).addClass('active');

        $anchorScroll();
        $scope.activeTab = nextTabTitle;

    };

    $scope.Saving = false;

    //saves the checklist
    $scope.submitChecklist = function() {
        if (!$scope.Saving) { // this flag will prevent duplicate submissions.
            $scope.Saving = true;

            var promise = ChecklistService.save($scope.Checklist);

            if (promise != undefined) {
                promise.then(function(result) {
                    if (result.success) {
                        localStorage.removeItem(["Checklist." + $routeParams.Id]);
                        $location.path("reportsummary");
                    }
                    $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
                    $scope.Saving = false;
                });

            }
        }
    };

    var getUnansweredQuestions = function(checklist) {
        return $filter('filter')(checklist.Questions, function(questionAnswer) {
            return questionAnswer.Answer.SelectedResponseId == null
                || questionAnswer.Answer.Response == null
                || (
                    (questionAnswer.Answer.Response.Title == "Unacceptable" || questionAnswer.Answer.Response.Title == "Improvement Required")
                        &&
                        (questionAnswer.Answer.Timescale == null || questionAnswer.Answer.AssignedTo == null)
                );
        });
    };

    $scope.completeAndGenerateChecklist = function() {

        var unansweredQuestions = getUnansweredQuestions($scope.Checklist);

        if (unansweredQuestions.length > 0) {
            showUnansweredQuestions(unansweredQuestions);
            return;
        }

        if ($scope.Checklist.SiteVisit.VisitDate == undefined) {
            showInformationDialog('Visit Date', 'Please select a Visit Date');
            return;
        }

        if ($scope.Checklist.Jurisdiction == undefined) {
            showInformationDialog('Jurisdiction', 'Please select a Jurisdiction');
            return;
        }

        if ($scope.Checklist.EmailReportToPerson && isNullOrEmptyString($scope.Checklist.SiteVisit.EmailAddress)) {
            showInformationDialog('Main person seen email address', '"Email to main person seen", has been selected but their email address has not been entered.');
            return;
        }

        if ($scope.Checklist.EmailReportToPerson && !isValidEmailAddress($scope.Checklist.SiteVisit.EmailAddress)) {
            showInformationDialog('Main person seen email address', '"Email to main person seen", has been selected but an invalid email address has been entered.');
            return;
        }

        if ($scope.Checklist.EmailReportToOthers && (!angular.isDefined($scope.Checklist.OtherEmails) || $scope.Checklist.OtherEmails.length === 0)) {
            showInformationDialog('Other email address', '"Email report to others", has been selected but the additional emails addresses have not been entered.');
            return;
        }

        if (!$scope.Saving) { // this flag will prevent duplicate submissions.
            $scope.Saving = true;
            if ($scope.Checklist.Status == 'Completed' || $scope.Checklist.Status == 'Assigned') // needed to check 1st time completed for QA Email functionality
                $scope.checklistFirstComplete = false;

            $scope.Checklist.Status = 'Completed';
            $scope.Checklist.CompletedBy = $scope.user.fullname();
            $scope.Checklist.CompletedOn = new Date();
            $rootScope.blockUI();
            var promise = ChecklistService.save($scope.Checklist);

            if (promise != undefined) {
                promise.then(function(result) {

                    if (result.success) {
                        localStorage.removeItem(["Checklist." + $routeParams.Id]);
                        $location.path("reportsummary");

                        if ($scope.checklistFirstComplete == false)
                            ChecklistService.sendChecklistCompletedNotification($scope.Checklist.Id);
                    }

                    $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
                    $scope.Saving = false;
                    $rootScope.unblockUI();
                });

            }
        }
    };

    $scope.doReviewAndSubmit = function() {
        if (!$scope.Saving) { // this flag will prevent duplicate submissions.
            $scope.Saving = true;
            $scope.Checklist.Submit = true;

            $scope.Checklist.Status = "Submitted";
            $scope.Checklist.SubmittedBy = $scope.user.fullname();
            $scope.Checklist.SubmittedOn = new Date();

            $rootScope.alerts = [{ type: 'success', msg: "Your request has been submitted for processing." }];

            $rootScope.blockUI();

            var promise = ChecklistService.save($scope.Checklist);

            if (promise != undefined) {
                promise.then(function(result) {

                    $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
                    $scope.Saving = false;
                    $rootScope.unblockUI();

                    if (result.success) {
                        localStorage.removeItem(["Checklist." + $scope.Checklist.Id]);
                        $location.path("reportsummary");
                    }
                });
            }
        }

    };

    $scope.updatePDF = function() {

        var promise = ChecklistService.updatePDF($scope.Checklist);

    };

    $scope.lastSubmissionDate = null;
    ///$scope.lastSavedDate = null;

    $scope.ClientDetails = {
        "Id": null,
        "CompanyName": null,
        "CAN": null,
        "Sites": [{ "Postcode": "test PC" }]
    };

    $scope.questionAnswered = function(questionId, response) {
        var filteredQuestions = $filter('filter')($scope.Checklist.Questions, function(item) {
            return item.Question.Id == questionId;
        });

        if (filteredQuestions.length > 0) {
            var questionAnswer = filteredQuestions[0];
            //put to list of answer
            $scope.checkedQuestionList.push({
                Id: questionAnswer.Question.Id,
                Text: questionAnswer.Question.Text,
                CategoryId: questionAnswer.Question.CategoryId,
                CategoryNumber: questionAnswer.CategoryNumber,
                QuestionNumber: questionAnswer.QuestionNumber,
                Response: questionAnswer.Answer.SelectedResponseId
            });

            questionAnswer.Answer.SupportingEvidence = response.SupportingEvidence;
            questionAnswer.Answer.ActionRequired = response.ActionRequired;
            questionAnswer.Answer.GuidanceNotes = response.GuidanceNotes;
            questionAnswer.Answer.AssignedTo = null;
            questionAnswer.Answer.Timescale = null;
            questionAnswer.Answer.QaComments = response.QaComments;
            questionAnswer.Answer.AreaOfNonCompliance = response.ReportLetterStatement;
            questionAnswer.Answer.SupportingDocumentationStatus = null;
            questionAnswer.Answer.SupportingDocumentationDate = null;

            questionAnswer.Answer.Response = response;

            if (response.Title == "Not Applicable") {
                questionAnswer.Answer.GuidanceNotes = null;
                questionAnswer.Answer.Response.GuidanceNotes = null;
            }
        }
    };

    $scope.deleteQuestion = function(questionAnswer) {

        $scope.question = questionAnswer;

        $scope.options = {
            'title': 'Remove Question',
            'prompt': 'Are you sure you want to remove this question from the checklist?',
            'ok': 'Yes',
            'cancel': 'No'
        };
        var confirmDialog = $modal.open({
            scope: $scope,
            windowClass: "modal small",
            templateUrl: 'angular/partials/maintenance/confirmDialog.htm',
            controller: ConfirmDialogController,
            resolve: {
                question: function() {
                    return $scope.question;
                },
                options: function() {
                    return $scope.options;
                }
            }
        });

        confirmDialog.result.then(function(questionAnswer) {

            if (angular.isDefined(questionAnswer)) {
                $rootScope.alerts = [{ type: 'success', msg: "The question has been removed from the checklist." }];
                var index = $scope.Checklist.Questions.indexOf(questionAnswer);
                $scope.Checklist.Questions.splice(index, 1);
                ChecklistService.updateQuestionNumbers($scope.Checklist);
                $scope.save();
            }

        }, function() {
            //Cancel clicked.
        });
    };

    function getNotListedEmployees() {

        var employees = [];

        $($scope.Checklist.Questions).each(function(idx, questionAnswer) {
            if (questionAnswer.Answer.SelectedResponseId != null
                && questionAnswer.Answer.AssignedTo != null
                && questionAnswer.Answer.AssignedTo.Id == emptyGuid()
                && questionAnswer.Answer.AssignedTo.NonEmployeeName != '') {

                // add unique entries
                var found = false;
                $(employees).each(function(idx, employee) {
                    if (employee == questionAnswer.Answer.AssignedTo.NonEmployeeName) {
                        found = true;
                        return false;
                    }
                });

                if (!found) {
                    employees.push(questionAnswer.Answer.AssignedTo.NonEmployeeName);
                }
            }
        });

        return employees;
    }

    $scope.open = function(questionAnswer) {
        $scope.questionAnswer = questionAnswer;
        $scope.nonEmployees = getNotListedEmployees();

        var modalInstance = $modal.open({
            templateUrl: 'angular/partials/_response.htm',
            windowClass: "responsedetailsmodal scroll",
            controller: ResponseController,
            resolve: {
                questionAnswer: function() {
                    return angular.copy($scope.questionAnswer);
                },

                nonEmployees: function() {
                    return $scope.nonEmployees;
                },

                clientId: function() {
                    return $scope.Checklist.ClientId;
                },

                areQACommentsEnabled: function() {
                    return $scope.areQACommentsEnabled();
                }
            }
        });

        modalInstance.result.then(function(result) {

            $scope.questionAnswer.Question.Text = result.Question.Text;
            $scope.questionAnswer.Answer.AreaOfNonCompliance = result.Answer.AreaOfNonCompliance;
            $scope.questionAnswer.Answer.QaCommentsResolved = result.Answer.QaCommentsResolved;
            $scope.questionAnswer.Answer.SupportingEvidence = result.Answer.SupportingEvidence;
            $scope.questionAnswer.Answer.ActionRequired = result.Answer.ActionRequired;
            $scope.questionAnswer.Answer.GuidanceNotes = result.Answer.GuidanceNotes;
            $scope.questionAnswer.Answer.Timescale = result.Answer.Timescale;
            $scope.questionAnswer.Answer.AssignedTo = result.Answer.AssignedTo;
            $scope.questionAnswer.Answer.QaComments = result.Answer.QaComments;
            $scope.questionAnswer.Answer.QaSignedOffBy = result.Answer.QaSignedOffBy;
            $scope.questionAnswer.Answer.QaSignedOffDate = result.Answer.QaSignedOffDate;
            $scope.questionAnswer.Answer.SupportingDocumentationStatus = result.Answer.SupportingDocumentationStatus;
            $scope.questionAnswer.Answer.SupportingDocumentationDate = result.Answer.SupportingDocumentationDate;
        });
    };

    $scope.getResponseText = function(answer) {
        var result = '';

        if (answer.SupportingEvidence) result += answer.SupportingEvidence + "\n";
        if (answer.ActionRequired) result += answer.ActionRequired;
        if (answer.Timescale != null && answer.Timescale.Name != undefined) result += "Agreed Timescale: " + answer.Timescale.Name + '&nbsp;&nbsp;&nbsp;';
        if (answer.GuidanceNotes) result += " Guidance Note: " + answer.GuidanceNotes + '&nbsp;&nbsp;&nbsp;';

        if (answer.AssignedTo != null) {
            if (answer.AssignedTo.Id != emptyGuid() && answer.AssignedTo.FullName != null) {
                result += "Assigned To: " + answer.AssignedTo.FullName + '&nbsp;&nbsp;&nbsp;';
            } else if (answer.AssignedTo.NonEmployeeName != undefined) {
                result += "Assigned To: " + answer.AssignedTo.NonEmployeeName + '&nbsp;&nbsp;&nbsp;';
            }
        }


        return result;

    };

    $scope.backToReportSummary = function() {
        $location.path("reportsummary");
    };

    $scope.showDatePicker = function() {
        $timeout(function() {
            $scope.opened = true;
        });
    };

    $scope.openAddBespokeQuestionModal = function(questionCategory) {

        var orderNumber = 0;

        $($scope.Checklist.Questions).each(function(index, questionAnswer) {
            if (questionAnswer.Question.OrderNumber > orderNumber && questionAnswer.Question.Category.Id == questionCategory.Id) {
                orderNumber = questionAnswer.Question.OrderNumber;
            }
        });

        orderNumber++;

        var modalInstance = $modal.open({
            templateUrl: 'angular/partials/addbespokequestion.htm',
            controller: AddBespokeQuestionController,
            resolve: {
                category: function() {
                    return questionCategory;
                },
                orderNumber: function() {
                    return orderNumber;
                },
                clientId: $scope.Checklist.ClientId
            }
        });

        modalInstance.result.then(function(newQuestionAnswer) {
            //OK clicked.
            $scope.Checklist.Questions.push(newQuestionAnswer);
            ChecklistService.updateQuestionNumbers($scope.Checklist);
        }, function() {
            //Cancel clicked.
        });
    };

    $scope.openAddQuestionFromDatabaseModal = function(questionCategory) {

        var modalInstance = $modal.open({
            scope: $scope,
            windowClass: "modal scroll",
            templateUrl: 'angular/partials/adddefaultquestion.htm',
            controller: DefaultQuestionController,
            resolve:
            {
                checklist: function() {
                    return $scope.Checklist;
                },

                category: function() {
                    return questionCategory;
                }
            }
        });

        modalInstance.result.then(function() {
                $scope.save();
            },
            function() {

            });
    };

    $scope.immediate = function(immediateId, response) {
        //update the answer comments
        $.each($scope.Checklist.ImmediateRiskNotifications, function(index, immediate) {
            if (immediate.Id == immediateId) {
                immediate.Reference = response.Reference;
                immediate.Title = response.ActionRequired;
                immediate.SignificantHazard = response.Title;
                immediate.RecommendedImmediate = response.RecommendedImmediate;
                return false;
            }
        });
    };

    $scope.recordIRN = function() {

        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/_recordIRN.htm',
            controller: RecordIRNController,
            resolve: {
                //something: 'what'
                // immediate: null
                immediate: function() {
                    return null;
                }
            }
        });

        modalInstance.result.then(function() {
            //OK clicked.
        }, function() {
            //Cancel clicked.
        });
    };

    $scope.editRecordIRN = function(immediate) {
        $scope.immediate = immediate;
        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/_recordIRN.htm',
            controller: RecordIRNController,
            resolve: {
                //something: 'what'
                immediate: function() {
                    return $scope.immediate;
                }
            }
        });

        modalInstance.result.then(function() {
            $scope.save();
        }, function() {
            //Cancel clicked.
        });
    };

    $scope.deleteRecordIRN = function(immediate) {
        $scope.immediate = immediate;
        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/confirmpopup.htm',
            controller: ConfirmPopupController,
            resolve: {
                immediate: function() {
                    return $scope.immediate;
                }
            }
        });

        modalInstance.result.then(function() {
            //OK clicked.
        }, function() {
            //Cancel clicked.
        });
    };

    $scope.isCompleteDisabled = function() {
        return $scope.Checklist == undefined || $scope.Checklist.Status != 'Draft';
    };

    $scope.isSubmitDisabled = function() {
        return $scope.Checklist == undefined ||
        ($scope.Checklist.Status != 'Completed' && $scope.Checklist.Status != 'Assigned') ||
        ($scope.Checklist.ExecutiveSummaryUpdateRequired && IsNullOrUndefined($scope.Checklist.ExecutiveSummaryQASignedOffBy)) ||
        (!areAllQuestionsSignedOff($scope.Checklist));
    };

    $scope.enableEditSCData = function() {
        $scope.editDataEnabled = true;
    };

    $scope.areQACommentsEnabled = function() {
        return $scope.Checklist == undefined || $scope.Checklist.Status == 'Completed' || $scope.Checklist.Status == 'Assigned';

    };

    $scope.categoryHasQaComment = function(categoryId) {
        var hasQaComment = false;

        $.each($scope.Checklist.Questions, function(index, question) {
            if (question.Question.CategoryId == categoryId
                    && question.Answer.QaComments != undefined
                    && question.Answer.QaComments != null
                    && question.Answer.QaComments != ''
                    && question.Answer.QaSignedOffBy == null
            ) {
                hasQaComment = true;
                return;
            }
        });

        return hasQaComment;
    };

    $scope.getAllCategoryCommentsResolved = function(categoryId) {
        var allCommentsResolved = true;

        $.each($scope.Checklist.Questions, function(index, question) {
            if (question.Question.CategoryId == categoryId
                    && question.Answer.QaComments != undefined
                    && question.Answer.QaComments != null
                    && question.Answer.QaComments != ''
                    && question.Answer.QaSignedOffBy == null
                    && question.Answer.QaCommentsResolved != true
            ) {
                allCommentsResolved = false;
                return;
            }
        });

        return allCommentsResolved;
    };

    $scope.categoryCommentStatus = function(categoryId) {
        var commentStatus = "None";

        if ($scope.categoryHasQaComment(categoryId)) {
            commentStatus = "QaComments";
            if ($scope.getAllCategoryCommentsResolved(categoryId)) {
                commentStatus = "QaAllCommentsResolved";
            }
        };
        return commentStatus;
    };

    $scope.executiveSummaryCommentStatus = function() {
        var commentStatus = "None";


        if (angular.isDefined($scope.Checklist)) {
            if ($scope.Checklist.ExecutiveSummaryUpdateRequired == true) {
                commentStatus = "QaComments";

                if ($scope.Checklist.ExecutiveSummaryQACommentsResolved == true) {
                    commentStatus = "QaAllCommentsResolved";
                }
            }

            if ($scope.ExecutiveSummarySignedOff == true) {
                commentStatus = "QaAllCommentsSignedOff";
            }
        }

        return commentStatus;
    };

    $scope.areExecutiveSummaryUpdatesRequired = function() {
        var result = false;

        if (!IsNullOrUndefined($scope.Checklist)) {
            if (($scope.Checklist.Status == 'Completed' || $scope.Checklist.Status == 'Assigned')
                && $scope.Checklist.ExecutiveSummaryUpdateRequired == true) {
                result = true;
            };
        }

        return result;
    };

    $scope.isExecSummarySignedOff = function() {
        return (!IsNullOrUndefined($scope.Checklist) && !IsNullOrUndefined($scope.Checklist.ExecutiveSummaryQASignedOffBy));
    };

    $scope.signOffExecSummary = function() {

        if (IsNullOrUndefined($scope.Checklist.ExecutiveSummaryQASignedOffBy) ||
            IsNullOrUndefined($scope.Checklist.ExecutiveSummaryQASignedOffDate)) {
            $scope.Checklist.ExecutiveSummaryQASignedOffBy = $scope.user.fullname();
            $scope.Checklist.ExecutiveSummaryQASignedOffDate = new Date();
            /*$scope.Checklist.ExecutiveSummaryUpdateRequired = false;*/
        } else {
            $scope.Checklist.ExecutiveSummaryQASignedOffBy = null;
            $scope.Checklist.ExecutiveSummaryQASignedOffDate = null;
        }

        $scope.ExecutiveSummarySignedOff = $scope.isExecSummarySignedOff();
    };

    var areAllQuestionsSignedOff = function(checklist) {
        for (var i = 0; i < checklist.Questions.length; i++) {
            if (checklist.Questions[i].Answer.QaComments != null && checklist.Questions[i].Answer.QaComments != '' && checklist.Questions[i].Answer.QaSignedOffBy == null)
                return false;
        }
        return true;
    };

    $scope.isLetterGenerated = function() {
        return angular.isDefined($scope.Checklist) && $scope.Checklist.CoveringLetterContent != null && $scope.Checklist.CoveringLetterContent != "";
    };

    $scope.ClientEmployees = [];

    $scope.mainPersonSeenSelected = function(employeeId) {
        if (employeeId != null && !angular.isDefined($scope.Checklist.SiteVisit.PersonSeen)) {
            $scope.Checklist.SiteVisit.PersonSeen = {};
        };

        if (employeeId == null) {
            $scope.Checklist.SiteVisit.PersonSeen.Id = null; //= emptyGuid(); //need to set to empty guid to prevent bad request when submitting to the api ,"Could not cast or convert from {null} to System.Guid."
            $scope.Checklist.SiteVisit.PersonSeen.Name = null;
            $scope.Checklist.SiteVisit.PersonSeen.EmailAddress = null;
            $scope.Checklist.SiteVisit.EmailAddress = null;
        } else if (employeeId == emptyGuid()) {
            $scope.Checklist.SiteVisit.PersonSeen.Id = emptyGuid();
            $scope.Checklist.SiteVisit.PersonSeen.Name = null;
            $scope.Checklist.SiteVisit.PersonSeen.EmailAddress = null;
            $scope.Checklist.SiteVisit.EmailAddress = null;
        } else {
            var employees = $filter('filter')($scope.ClientEmployees, { "Id": employeeId }, true);
            var employee = employees[0];

            if (employee != null && angular.isDefined(employee)) {
                $scope.Checklist.SiteVisit.PersonSeen.Id = employee.Id;
                $scope.Checklist.SiteVisit.PersonSeen.Name = employee.FullName;
                $scope.Checklist.SiteVisit.PersonSeen.EmailAddress = employee.EmailAddress;
                $scope.Checklist.SiteVisit.EmailAddress = employee.EmailAddress;
            }
        }

    };

    //the drop down list will only update the Id field. This function will update the associated name and email address
    $scope.personSeenSelected = function(person) {
        if (person.EmployeeId == null || $scope.isEmployeeIdNotListed(person.EmployeeId)) {
            person.FullName = null;
            person.EmailAddress = null;
        } else {
            var employees = $filter('filter')($scope.ClientEmployees, { "Id": person.EmployeeId }, true);
            var employee = employees[0];
            person.FullName = employee.FullName;
            person.EmailAddress = employee.EmailAddress;
        }

    };

    $scope.isEmployeeNotListed = function(person) {
        var result = false;

        if (person != undefined
            && person.Id == emptyGuid()) {
            result = true;
        }
        return result;
    };

    $scope.isEmployeeIdNotListed = function(employeeId) {
        return employeeId == emptyGuid();
    };

    $scope.doesPersonHaveEmail = function(person) {

        if (angular.isDefined(person)
            && angular.isDefined(person.EmailAddress)
            && person.EmailAddress != null
            && person.EmailAddress.length > 0) {
            return true;
        }

        return false;
    };

    $scope.doesEmployeeHaveEmail = function(employeeId) {

        var employees = $filter('filter')($scope.ClientEmployees, { "Id": employeeId }, true);
        if (employees.length == 0) {
            return false;
        }
        var employee = employees[0];

        return employee.EmailAddress != null && employee.EmailAddress.length > 0;
    };

    $scope.updateSubmitStatus = function() {

        if ($scope.Checklist.ExecutiveSummaryUpdateRequired == true
            && IsNullOrUndefined($scope.ExecutiveSummaryQASignedOff)) {
            $scope.Checklist.UpdatesRequired = true;
        }

        if ($scope.Checklist.UpdatesRequired == true) {
            $scope.checked = false;
            $scope.readyToSubmit = false;
        }
    };

    $scope.readyToSubmitChanged = function() {
        if ($scope.readyToSubmit && executiveSummaryHelper.doesExecutiveLetterContainColouredText($scope.Checklist.CoveringLetterContent)) {
            yesFunction = function() { $scope.Checklist.UpdatesRequired = false; };
            noFunction = function() { $scope.readyToSubmit = false; };
            showYesNoDialog("Executive Summary Letter", "The executive summary contains coloured text. Are you sure you want to submit?", yesFunction, noFunction);
        } else if ($scope.readyToSubmit) {
            $scope.Checklist.UpdatesRequired = false;
        }
    };

    $scope.sendUpdateRequireNotification = function() {
        $scope.save();
        $rootScope.blockUI();
        var promise = ChecklistService.sendUpdateRequireEmailNotification($scope.Checklist.Id);
        promise.then(function(result) {
            $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
            if (result.success) {
                $location.path("reportsummary");
            }
            $rootScope.unblockUI();
        });
    };

    $scope.AddPersonSeen = function() {
        if (!angular.isDefined($scope.Checklist.PersonsSeen)) {
            $scope.Checklist.PersonsSeen = [];
        }
        $scope.Checklist.PersonsSeen.push({ "Id": guid(), "EmployeeId": null, "FullName": null, "EmailAddress": null });
    };

    $scope.RemovePersonSeen = function(personSeen) {
        if (!angular.isDefined($scope.Checklist.PersonsSeen)) {
            $scope.Checklist.PersonsSeen = [];
        }

        var index = $.inArray(personSeen, $scope.Checklist.PersonsSeen);

        $scope.Checklist.PersonsSeen.splice(index, 1);

    };

    $scope.isSubmitReadOnly = false;
    $scope.userHasQaRole = false;


    $scope.emptyGuid = function() {
        return emptyGuid();
    };

    $scope.getAssignedToName = function(answer) {
        if (answer.AssignedTo != null) {
            if (answer.AssignedTo.Id == emptyGuid() && answer.AssignedTo.NonEmployeeName != undefined) {
                return answer.AssignedTo.NonEmployeeName;
            }

            if (answer.AssignedTo.Id != emptyGuid() && answer.AssignedTo.FullName != null) {
                return answer.AssignedTo.FullName;
            }
        }

        return "";
    };

    $scope.isNullOrEmptyString = function(value) {
        return isNullOrEmptyString(value);
    };

    $scope.setActiveTab = function(tabTitle) {
        $scope.activeTab = tabTitle;
    };

    $scope.validateOtherEmailAddresses = function(emailAddress) {
        return isValidEmailAddress(emailAddress);
    };

    $scope.addOtherEmail = function() {
        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/otheremail.htm',
            controller: OtherEmailController,
            resolve: {
                otherEmail: function() {
                    return { "Id": guid(), "Name": null, "EmailAddress": null };
                }
            }
        });

        modalInstance.result.then(function(newOtherEmail) {
            if (!angular.isDefined($scope.Checklist.OtherEmails)) {
                $scope.Checklist.OtherEmails = [];
            }
            $scope.Checklist.OtherEmails.push({ "Id": newOtherEmail.Id, "Name": newOtherEmail.Name, "EmailAddress": newOtherEmail.EmailAddress });

        }, function() {
            //Cancel clicked.
        });
    };

    $scope.editOtherEmail = function(otherEmailToEdit) {
        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/otheremail.htm',
            controller: OtherEmailController,
            resolve: {
                otherEmail: function() {
                    return otherEmailToEdit;
                }
            }
        });

        modalInstance.result.then(function(editedOtherEmail) {
            if (!angular.isDefined($scope.Checklist.OtherEmails)) {
                $scope.Checklist.OtherEmails = [];
            }

            var index = $.inArray(editedOtherEmail, $scope.Checklist.OtherEmails);
            $scope.Checklist.OtherEmails[index].EmailAddress = editedOtherEmail.EmailAddress;

        }, function() {
            //Cancel clicked.
        });
    };

    $scope.RemoveOtherEmail = function(otherEmail) {
        if (!angular.isDefined($scope.Checklist.OtherEmails)) {
            $scope.Checklist.OtherEmails = [];
        }

        var index = $.inArray(otherEmail, $scope.Checklist.OtherEmails);

        $scope.Checklist.OtherEmails.splice(index, 1);

    };

    //enable this functionality, if we are able to not show this message, when the user clicks on the print icon.
    //$window.onbeforeunload = function (event) {
    //    if (executiveSummaryEditorWindow != null && executiveSummaryEditorWindow.location != null) {
    //        event.preventDefault();
    //        return "You have the exceutive summary letter window open. Before reloading the page, save changes to the executive summary letter and close the editor window before continuing.";
    //    }
    //};

    $scope.$on('$locationChangeStart', function(event, next, current) {
        if (executiveSummaryEditorWindow != null && !executiveSummaryEditorWindow.closed) {
            alert("You have the exceutive summary letter window open. Save changes to the executive summary letter and close the editor window before continuing.");
            event.preventDefault();
        }

    });

    $scope.markChecklistAsFavourite = function(checklistId) {
        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/favourites.htm',
            controller: FavouritesController,
            resolve: {
                ChecklistId: function() {
                    return checklistId;
                }
            }
        });

        modalInstance.result.then(function(title) {
            var promise = ChecklistService.markChecklistAsFavourite(checklistId, title);
            promise.then(function(result) {
                if (result.success) {
                    $scope.Checklist.Favourite = result.data;
                    $rootScope.alerts = [{ type: 'success', msg: result.msg }];
                } else {
                    $rootScope.alerts = [{ type: 'error', msg: result.msg }];
                }
            });
        }, function() {
            //Cancel clicked.
        });
    };

    $scope.unMarkChecklistAsFavourite = function(checklistId) {
        var options = {
            "Heading": 'Umark As Favourite',
            "Message": 'Are you sure you want to unmark this checklist as favourite?',
            "ShowOkButton": true,
            "ShowCancelButton": true
        };
        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/genericConfirmationPopup.htm',
            controller: GenericConfirmationPopupController,
            resolve: {
                Options: function() {
                    return options;
                }
            }
        });

        modalInstance.result.then(function() {
            var promise = ChecklistService.unMarkChecklistAsFavourite(checklistId);
            promise.then(function(result) {
                if (result.success) {
                    $scope.Checklist.Favourite = null;
                    $rootScope.alerts = [{ type: 'success', msg: result.msg }];
                } else {
                    $rootScope.alerts = [{ type: 'error', msg: result.msg }];
                }
            });
        }, function() {
            //Cancel clicked.
        });
    };

    $scope.showSaveAlert = function (message) {
        var options = {
            "Heading": 'Saved',
            "Message": message,
            "ShowOkButton": true,
            "ShowCancelButton": false
        };
        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/genericConfirmationPopup.htm',
            controller: GenericConfirmationPopupController,
            resolve: {
                Options: function () {
                    return options;
                }
            }
        });

        modalInstance.result.then(function () {
        }, function () {
            //Cancel clicked.
        });
    };

    //var filterSpecialReportTemplates = function() {
    //    if()
    //}

    var init = function() {
        AccountService.get(function(result) {
            $rootScope.user = result;
            $scope.userHasQaRole = ($rootScope.user.role == AccountService.getRoles().qa);
            LoadChecklist();
            
            $scope.isSubmitReadOnly = (angular.isDefined($scope.user) && $scope.user.role != AccountService.getRoles().qa);
        });
    };

    init();

}
