

function ClientSearchController($rootScope, $scope, $routeParams, $modal, $location, $window, ClientServiceREST, ChecklistService, TemplateService) {
    console.log('ClientSearchController start');
   
    $scope.templates = TemplateService.getTemplates();

    $scope.loadClientDetails = function () {
        $location.path("clientsearch/" + $scope.CAN);
    };

    function addLocalChecklistDetails() {
        $($scope.Sites).each(function (idx, site) {
            if (site.Checklist.Id == null) {

                var checklists = ChecklistService.queryLocal($scope.ClientDetails.CAN, site.Id);

                if (checklists.length) {
                    $(checklists).each(function (idx, checklist) {

                        if (checklist.Status != 'Submitted') {
                            site.Checklist.Id = checklist.Id;
                            return false;
                        }
                    });
                }
            }
        });
    }

    $scope.retrieveClientDetails = function (clientAccountNumber) {
        $rootScope.blockUI();
        ClientServiceREST.query(clientAccountNumber, function (clientDetailsData) {
            $scope.ClientDetails = clientDetailsData;
            $scope.Sites = clientDetailsData.Sites;

            addLocalChecklistDetails();
            $rootScope.unblockUI();
        });
    };

    $scope.createNewChecklist = function(clientAccountNumber, siteId) {
        $.each($scope.Sites, function(idx, site) {
            if (site.Id == siteId) {
                $rootScope.Site = site;
            }
        });
        $location.path("createchecklist/" + clientAccountNumber + '/' + siteId);
    };

    //cloneChecklist: Moved to app.js as required for favourites as well. Just to avoid code replication.
    //$scope.cloneChecklist = function (checklistId) {
    //    var modalInstance = $modal.open({
    //        scope: $scope,
    //        templateUrl: 'angular/partials/cloneChecklistPopup.htm',
    //        controller: CloneChecklistController,
    //        resolve:
    //            {
    //            }
    //    });

    //    modalInstance.result.then(function (result) {
    //        console.log(result);

    //        if (result.SelectedSiteIDs.length == 0) {
    //            return;
    //        }            
            
    //        $rootScope.blockUI();
    //        var promise = ChecklistService.cloneReport(checklistId, result.SelectedSiteIDs, result.ClientId, result.WithResponses);

    //        promise.then(function (result) {
    //            if (result.success) {
    //                if (result.data.length == 1) {
    //                    // Client summary page
    //                    $location.path("evaluationchecklists/" + result.data[0].ChecklistId);
    //                }
    //                else {
    //                    // Report Summary page
    //                    $location.path("reportsummary/");
    //                }
    //            }
                
    //            $rootScope.unblockUI();
    //        });
           
    //    },

    //        function () {
    //            //Cancel clicked.
    //        });

    //};


    if ($routeParams.clientAccountNumber != undefined && $routeParams.clientAccountNumber.length > 0) {
        $scope.CAN = $routeParams.clientAccountNumber;
        $scope.retrieveClientDetails($scope.CAN);
    } else {
        $scope.CAN = "";
    }

    $scope.clientDetailsNotFound = function() {
        return ($scope.ClientDetails == undefined || $scope.ClientDetails == null);
    };

    $scope.backToReportSummary = function () {
        $location.path("reportsummary" );
    };

    $scope.openCopyChecklistWizard = function (site) {
        var modalInstance = $modal.open({
            scope: $scope,           
            templateUrl: 'angular/partials/copyChecklistPopup.htm',
            controller: CopyChecklistController,
            resolve: {
                clientAccountNumber: function () 
                {
                    return $scope.CAN;
                },
                
                site: function () {
                    return site;
                }

            }
        });

        modalInstance.result.then(function (result) {                        
            switch (result.CopyOption) {
                case "New":
                    $.each($scope.Sites, function (idx, site) {
                        if (site.Id == result.SiteId) {
                            $rootScope.Site = site;
                        }
                    });
                    
                $location.path("createchecklist/" + result.ClientAccountNumber + "/" + result.SiteId);
                break;

            case "WithResponses":
                copyChecklistWithResponse(result.ChecklistId, result.SiteId, $scope.ClientDetails.Id);
                break;

            case "WithoutResponses":
                copyChecklist(result.ChecklistId, result.SiteId, $scope.ClientDetails.Id);
                break;

            default:
            }

        }, function () {
            //Cancel clicked.
        });
    };

var copyChecklist = function (checklistId, siteId, clientId) {
    
        $rootScope.blockUI();
        var promise = ChecklistService.copyAndCreateNewChecklistWithoutResponses(checklistId, siteId, clientId);
        promise.then(function(result) {
            if (result.success)
            {
                $location.path("evaluationchecklists/" + result.data[0].ChecklistId);
            }
            $rootScope.unblockUI();
        });
    };

var copyChecklistWithResponse = function (checklistId, siteId, clientId) {
        $rootScope.blockUI();
        var promise = ChecklistService.copyAndCreateNewChecklistWithResponses(checklistId, siteId, clientId);
        promise.then(function (result) {
            if (result.success) {
                $location.path("evaluationchecklists/" + result.data[0].ChecklistId);
            }
            $rootScope.unblockUI();
        });
    };
}

