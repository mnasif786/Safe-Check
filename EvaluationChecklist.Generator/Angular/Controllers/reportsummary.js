function ReportSummaryController($rootScope, $scope, $location, $timeout, $window, $filter, $position, $modal, AccountService, ChecklistService, ConfigService) {
    $rootScope.checkForNewVersion($window);
    $rootScope.ChecklistLastSuccessfullySavedToServer = null;
    $rootScope.ChecklistLastSavedlocaly = null;
    $rootScope.postChecklistInProgress = false;
    
    $scope.create = function () {
        $location.path("clientsearch/");
    };

    $scope.status = { "type": "select",
        "Id": "Status",
        "Name": "",
        "Names": ["Draft", "Completed", "Submitted", "Deleted", "Assigned"]
    };

    $scope.OrderBy = { "Predicate": "CreatedOn", "Reverse": true };

    $scope.results = [];

    var submitToClientTargetDays = 14;

    $scope.assignChecklistToQaAdvisor = function (index, checklistId, selectedAdvisor, defaultQaAdvisor) {

        var defaultQaAdvisorId = (defaultQaAdvisor != undefined) ? defaultQaAdvisor.Id : -1;

        if (selectedAdvisor != undefined && selectedAdvisor.Id != defaultQaAdvisorId) {

            var modalInstance = $modal.open({
                scope: $scope,
                templateUrl: 'angular/partials/assignQaAdvisorPopup.htm',
                controller: AssignQaAdvisorPopupController,
                resolve: {
                    checklistId: function () {
                        return checklistId;
                    },
                    qaAdvisor: function () {
                        return selectedAdvisor;
                    }
                }
            });

            modalInstance.result.then(function () {
                //OK clicked.
                $scope.results[index].DefaultQaAdvisor = selectedAdvisor;
                $scope.results[index].Status = 'Assigned';
                if ($scope.results[index].QaAdvisorAssignedOn == null) {
                    $scope.results[index].QaAdvisorAssignedOn = new Date();
                }
                $scope.getLocalDrafts();

            }, function () {
                //Cancel clicked.
            });
        }
    };

    var findQaAdvisorInArray = function(arrayToSearch, qaAdvisorId) {
        var qaAdvisor = null;
        for (var j = 0; j <= arrayToSearch.length; j++) {
            if (arrayToSearch[j].Id == qaAdvisorId) {
                qaAdvisor = arrayToSearch[j];
                break;
            }
        }
        return qaAdvisor;
    };

    $scope.search = function (block) {

        $scope.showMyFavourites = false;

        if (block) {
            $rootScope.blockUI();
        }
        

        var criteria = $scope.getSearchCriteria(false);
        
        ChecklistService.query(criteria.can, criteria.user, criteria.visitDate, criteria.status, criteria.includeDeleted, criteria.excludeSubmited, criteria.statusFromDate, criteria.statusToDate, function (data) {

            //sets the default value of a qaAdvisor dropdown to the value coming from database if any.
            for (var i = 0; i < data.length; i++) {
                data[i].index = i;
                data[i].QaStatusOrder = data[i].Status + $scope.qaStatusOrder(data[i]); //create a new property to order by status and qaComments status
                if (data[i].QaAdvisor != undefined) {
                    var qaAdvisor = findQaAdvisorInArray($scope.qaAdvisors, data[i].QaAdvisor.Id);
                    if (qaAdvisor != null) {
                        data[i].QaAdvisor = qaAdvisor;
                        data[i].DefaultQaAdvisor = qaAdvisor;
                    }
                }
            }

            //add status date and SLA column
            angular.forEach(data, function (item) {
                item.StatusDate = $scope.getStatusDate(item);
                setSLAData(item);
            });
                  
            $scope.results = data;

            $scope.predicate = $scope.OrderBy.Predicate;
            $scope.reverse = $scope.OrderBy.Reverse;

            $rootScope.unblockUI();
        });
    };

    var setSLAData = function(item) {
        if (!angular.isDefined(item.VisitDate)) {
            item.SLA = 0;
            return;
        }

        var daysLeft = 0;

        if (item.Status == 'Deleted'){
            item.SLA = 0;
        }
        else if (item.Status == 'Submitted') {
            daysLeft = $scope.getSubmitToClientTargetDays(item.VisitDate, new Date(item.SubmittedOn));
            item.SLA = $scope.getSLAStatusText(daysLeft, item.Status);
        } else {
            daysLeft = $scope.getSubmitToClientTargetDays(item.VisitDate, new Date());
            item.SLA = $scope.getSLAStatusText(daysLeft, item.Status);
        }
    };

    $scope.getSearchCriteria = function (withDefaultValues) {

        var criteria = {
            "can": '',
            "user": '',
            "status": '',
            "visitDate": '',
            "statusFromDate": '',
            "statusToDate": '',
            "includeDeleted": false,
            "excludeSubmited": false,
            "showFavourites": true
        };

        if (withDefaultValues == false) {
            criteria.can = $scope.can != undefined ? $scope.can : '';
            criteria.user = $scope.selectedUser != undefined ? $scope.selectedUser : '';
            criteria.status = ($scope.status != undefined && ($scope.status.Name != undefined) && $scope.status.Name != "Deleted") ? $scope.status.Name : '';
            criteria.visitDate = $scope.visitDate != undefined ? $scope.visitDate : '';
            criteria.statusFromDate = $scope.statusFromDate != undefined ? $scope.statusFromDate : '';
            criteria.statusToDate = $scope.statusToDate != undefined ? $scope.statusToDate : '';
            criteria.includeDeleted = $scope.status != undefined && $scope.status.Name != undefined && $scope.status.Name == "Deleted";
            criteria.excludeSubmited = criteria.status == '' && $rootScope.user.role == AccountService.getRoles().consultant;
            criteria.showFavourites = false;
        }

        return criteria;
    };
    
    $scope.clear = function () {
        $scope.can = '';
        $scope.selectedUser = '';
        $scope.visitDate = '';
        $scope.statusFromDate = '';
        $scope.statusToDate = '';
        $scope.status.Name = '';
        $scope.results = [];
    };

    $scope.sort = function (key) {
        $scope.results = sortByKey($scope.results, key);
    };

    $scope.getAddress = function (site) {
        var address = '';

        if (site == null) {
            return address;
        }

        if (site.Address1)
            address += site.Address1;

        if (site.Address2)
            address += ',' + site.Address2;

        if (site.Address3)
            address += ',' + site.Address3;

        if (site.Address4)
            address += ',' + site.Address4;

        if (site.Postcode)
            address += ',' + site.Postcode;

        return address;
    };

    $scope.open = function () {
        $timeout(function () {
            $scope.opened = true;
        });
    };

    $scope.navigateToFindClient = function () {
        $location.path("clientsearch");
    };
    
    $scope.init = function () {
        $rootScope.blockUI();

        $scope.showMyFavourites = false;

        $scope.getLocalDrafts();

        AccountService.get(function (result) {
            $rootScope.user = result;

            AccountService.getQaAdvisors(function (data) {
                $scope.qaAdvisors = data;
            });

            ChecklistService.getDistinctCreatedBy(function (data) {
                $scope.consultants = data;

                // If QA
                if ($rootScope.user.role == AccountService.getRoles().qa) {
                    $scope.status.Name = 'Assigned';
                    $scope.selectedUser = $rootScope.user.fullname();
                    $scope.OrderBy.Predicate = 'VisitDate';
                    $scope.OrderBy.Reverse = false;
                    $scope.search();
                }
                else {
                    $($scope.consultants).each(function (idx, consultant) {
                        if (consultant == $rootScope.user.fullname()) {
                            $scope.selectedUser = $rootScope.user.fullname();
                            $scope.search();
                            return false;
                        }
                        $scope.unblockUI();
                    });

                    if ($scope.consultants.length == 0) {
                        $scope.unblockUI();
                    }
                }
            });
        });
    };

    $scope.uploadLocalChecklistToServer = function (checklistId) {
        $rootScope.blockUI();
        ChecklistService.uploadLocalChecklistAndRemove(checklistId).then(function (result) {
            if (result.success) {

                $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: 'Checklist successully uploaded.'}];

                var itemInResultList = $filter('filter')($scope.results, { "Id": checklistId })[0];
                if(angular.isDefined(itemInResultList)){
                    itemInResultList.Local = false;
                }
                $scope.getLocalDrafts();
            }
            else {
                $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg}];
            }
            $rootScope.unblockUI();
        });
    };

    $scope.downloadChecklist = function (checklistId) {
        $rootScope.blockUI();
        var isDownload = true;
        ChecklistService.getFromServer(checklistId, isDownload, function (result) {
            if (result.success) {
                try {
                    ChecklistService.saveToLocalStorage(result.checklist);
                    result.message = 'Checklist successully downloaded.';
                }
                catch (err){
                    $rootScope.unblockUI();
                    throw err;
                }
                $scope.search();
                $scope.getLocalDrafts();
                    $rootScope.alerts = [{ type: 'success', msg: result.message}];
            } else {
                $rootScope.alerts = [{ type: 'error', msg: result.message}];
                $rootScope.unblockUI();
            }
        });
    };

    $scope.deleteChecklist = function (checklistId) {

        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/confirmDeleteChecklistPopup.htm',
            controller: ConfirmDeleteChecklistController
        });

        modalInstance.result.then(function () {
            //OK clicked.
            $rootScope.blockUI();

            var deleteInMemoryAndLocalStorage = function (data) {
                $rootScope.alerts = [{ type: 'success', msg: 'Checklist deleted from server.'}];
                localStorage.removeItem("Checklist." + checklistId);
                $scope.search();
                $scope.getLocalDrafts();
                $rootScope.unblockUI();
            };

            var notFoundOnServer = function () {
                $rootScope.alerts = [{ type: 'error', msg: 'Checklist does not exist on server and so could not be deleted.'}];
                localStorage.removeItem("Checklist." + checklistId);
                $scope.getLocalDrafts();
                $scope.search();
                $rootScope.unblockUI();
            };

            var otherError = function () {
                $rootScope.alerts = [{ type: 'error', msg: 'Error connecting to server.'}];
                $rootScope.unblockUI();
            };

            ChecklistService.deleteChecklistFromServer(checklistId, deleteInMemoryAndLocalStorage, notFoundOnServer, otherError);
            }, function () {
            //Cancel clicked.
        });
    };

    $scope.users = function () {
        var userArray = [];
        if (angular.isDefined($scope.qaAdvisors)) {
            angular.forEach($scope.qaAdvisors, function (value, key) {
                this.push(value.Fullname);
            }, userArray);
        }

        if (angular.isDefined($scope.consultants)) {

            angular.forEach($scope.consultants, function (consultant, key) {

                var found = false;

                angular.forEach(userArray, function (user, key) {
                    if(consultant == user){
                        found = true;
                    }
                });

                if(!found){
                    this.push(consultant);
                }
            }, userArray);
        }

        return userArray;
    };

    $scope.SubmittedPDFDownloadUrl = function (checklistId) 
    {
        return ConfigService.getConfig().apiUrl  + 'summary/' + checklistId;
    };

    $scope.showPrintIcon = function (result) {
        return ( angular.isUndefined(result.Deleted) || result.Deleted != true )
            && result.Status == 'Submitted'
            && (result.ExecutiveSummaryDocumentLibraryId != 0 && result.ExecutiveSummaryDocumentLibraryId != null);        
    };
    
    $scope.getAllChecklistCommentsResolved = function (currentChecklist) {
        var commentStatus = "None";

        if (currentChecklist.HasQaComments || currentChecklist.ExecutiveSummaryUpdateRequired == true) 
        {
            commentStatus = "AllQaCommentsResolved";

            if (currentChecklist.HasUnresolvedQaComments || currentChecklist.ExecutiveSummaryQACommentsResolved != true)
                commentStatus = "HasUnresolvedQaComments";
        }

        return commentStatus;
    };

    $scope.qaStatusOrder = function(searchResultItem) {
        if (searchResultItem.HasQaComments && searchResultItem.HasUnresolvedQaComments) {
            return 1;
        }

        if (searchResultItem.HasUnresolvedQaComments) {
            return 1;
        }

        if (searchResultItem.HasQaComments && !searchResultItem.HasUnresolvedQaComments) {
            return 2;
        }

        return 0;
    };

    //this function hides the server results when the user goes offline
    $scope.searchResultItemVisible = function (resultItem) { 
        return ($rootScope.isOnlineAndWorkingOnline($window) || resultItem.Local);
    };

    $scope.searchResultItemVisibleCount = function() {
        if ($scope.results.length == 0) {
            return 0;
        }

        return $filter('filter')($scope.results, $scope.searchResultItemVisible).length;
    };
    
    $scope.getSLAStatusText = function (daysToSubmitTarget, status) {

        if (status == 'Deleted') {
            return '';
        }

        if (status == 'Submitted') {
            if (daysToSubmitTarget < 0) {
                return '<span>Overdue</span>';
            } else {
                return '<span>In SLA</span>';
            }
        }

        if (daysToSubmitTarget == null) {
            return '';
        }

        if (daysToSubmitTarget >= 0 && daysToSubmitTarget < 4) {
            if (daysToSubmitTarget == 1) {
                return '<span style="color: rgb(255, 165, 0);">' +
                daysToSubmitTarget + ' Day to Client</span>';
            }

            return '<span style="color: rgb(255, 165, 0);">' +
                daysToSubmitTarget + ' Days to Client</span>';
        }

        if (daysToSubmitTarget == -1) {
            return '<span style="color: rgb(255, 0, 0);">' +
                Math.abs(daysToSubmitTarget) + ' Day Overdue</span>';
        }

        if (daysToSubmitTarget < 0) {
            return '<span style="color: rgb(255, 0, 0);">' +
                Math.abs(daysToSubmitTarget) + ' Days Overdue</span>';
        }

        return '<span style="color: rgb(76, 153, 0);">' +
                daysToSubmitTarget + ' Days to Client</span>';
    };

    $scope.getSubmitToClientTargetDays = function (visitDate, comparisonDate) {
        // get days left to submit
        if (visitDate == null || angular.isUndefined(visitDate))
            return null;

        var targetDate = new Date(visitDate);
        var day = targetDate.getDate();
        // add one on for visit date day
        targetDate.setDate(day + submitToClientTargetDays + 1);

        // cut off hours/mins 
        var compareDateEpochTime = new Date(comparisonDate.getFullYear(), comparisonDate.getMonth(), comparisonDate.getDate()).getTime() / 1000;
        var targetDateEpochTime = targetDate.getTime() / 1000;

        var elapsedTime = targetDateEpochTime - compareDateEpochTime;

        // divide by an Epoch day
        var daysLeft = Math.floor(elapsedTime / 86400);

        if (daysLeft < 1) {
            return daysLeft - 1;
        } else
            return daysLeft;
    };

    $scope.getStatusDate = function(item){

        var result =  item.CreatedOn;

        var deleted = angular.isDefined(item.Deleted) && item.Deleted == true;

        if(deleted == false){
            switch (item.Status)
            {
                case 'Draft':
                    result = item.CreatedOn;
                    break;
                case 'Completed':
                    result = item.CompletedOn;
                    break;
                case 'Assigned':
                    result = item.QaAdvisorAssignedOn;
                    break;
                case 'Submitted':
                    result = item.SubmittedOn;
                    break;
                default:
                    result =  item.CreatedOn;
                    break;
            }
        }
        else {
            result = item.UpdatedOn;
        }
        return result;
    };
     
    $scope.statusChanged = function () {
        if ($scope.status.Name == null) {
            $scope.statusFromDate = '';
            $scope.statusToDate = '';
        }
    };

    $scope.removeDraftsFromLocalStorage = function () {

        $scope.getLocalDrafts();

        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/clearLocalStoragePopup.htm',
            controller: ClearLocalStorageController
        });

        modalInstance.result.then(function () {
            //OK clicked.
            var localstorageDrafts = $filter('filter')($scope.localDrafts, { "Deleted": true });

            if (angular.isDefined(localstorageDrafts) && localstorageDrafts.length > 0) {
                var draftsNotDeleted = [];
                angular.forEach(localstorageDrafts, function (item) {
                    var promise = ChecklistService.deleteChecklistFromLocalStorage(item.Id);
                    promise.then(function (result) {
                        if (!result.success) {
                            draftsNotDeleted.push(localstorageDrafts.Id);
                        } 
                    });
                });

                if (draftsNotDeleted.length > 0) {
                    $rootScope.alerts = [{ type: 'error', msg: 'One or many Draft(s) have not been deleted from the local storage.' }];
                } else {
                    $rootScope.alerts = [{ type: 'success', msg: 'All the Selected Draft(s) have been deleted from the local storage.' }];
                }

                //refreshes the local storage & serach results
                $scope.search(true);
                $scope.getLocalDrafts();
            };
        }, function () {
            //Cancel clicked.
        });
    };

    $scope.getLocalDrafts = function () {
        $scope.localDrafts = ChecklistService.getDraftsFromLocalStorage();
    };

    $scope.favouriteSearchResultItemVisibleCount = 0;

    $scope.searchMyFavourites = function () {

        $scope.showMyFavourites = true;

        $scope.favouriteSearchResultItemVisibleCount = function () {
            return $scope.favouriteSearchResults.length;
        };

        $rootScope.blockUI();
        
        ChecklistService.searchFavouriteChecklists(function (data) {

            $scope.favouriteSearchResults = data;

            $scope.favouriteSearchResultItemVisibleCount = data.length;

            $scope.predicate = $scope.OrderBy.Predicate;
            $scope.reverse = $scope.OrderBy.Reverse;

            $rootScope.unblockUI();
        });
    };

    $scope.revertChecklist = function (checklistId) {
        $rootScope.blockUI();
        var promise = ChecklistService.revertChecklist(checklistId);
        $rootScope.unblockUI();
        promise.then(function (result) {
            if (result.success) {
                if (JSON.parse(result.data) == true) {
                    $scope.search(true);
                    $rootScope.alerts = [{ type: 'success', msg: "Safecheck report has been reverted successfully." }];
                } else {
                    ChecklistService.showInformationDialog('Safecheck Report', 'Safecheck report cannot be reverted because actions have been assigned in BusinessSafe Online.');
                }
                
            } else {
                $rootScope.alerts = [{ type: 'error', msg: result.msg }];
            }
        });
    }

    $scope.init();
};
