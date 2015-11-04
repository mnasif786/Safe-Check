function CreateChecklistController($rootScope, $scope, $routeParams, $location, $timeout, $filter, $window, ClientServiceREST, ChecklistService, IndustryService, ClientQuestionService, ChecklistTemplateService) {
    console.log('CreateChecklistController start');

    $scope.Industries = [];
    $scope.alerts = [];
    if ($routeParams.clientAccountNumber != undefined) {
        $scope.clientAccountNumber = $routeParams.clientAccountNumber;
    } else {
        $scope.clientAccountNumber = "not set";
    }

    if ($routeParams.siteId != undefined) {
        $scope.siteId = $routeParams.siteId;
    } else {
        $scope.siteId = "not set";
    }

    var retrieveClientDetails = function (clientAccountNumber) {
        ClientServiceREST.query(clientAccountNumber, function (clientDetailsData) {
            $scope.ClientDetails = clientDetailsData;
        });
    };

    $scope.createNewChecklist = function(siteId) {
        createNewChecklist($scope.ClientDetails.Id, siteId);
    };

    $scope.cancelCreateChecklist = function() {
        $location.path("clientsearch/" + $scope.CAN);
    };

    $scope.industryChanged = function () {
        if ($scope.selectedIndustry != null) {
            $scope.selectedBespokeTemplate = null;
        }
    };

    $scope.bespokeChanged = function () {
        if ($scope.selectedBespokeTemplate != null) {
            $scope.selectedIndustry = null;
        }
    };

    var filterMandatoryNonDeletedQuestions = function(questions) {
        if (questions.length > 0 && angular.isDefined(questions[0].Deleted)) {
            return $filter('filter')(questions, { "Mandatory": true, "Deleted": false });
        }
        else {
            return $filter('filter')(questions, { "Mandatory": true });
        }
    };

    var createNewChecklist = function (clientId, siteId) {
        
        if ($scope.selectedIndustry == undefined && $scope.selectedBespokeTemplate == undefined) {
            $rootScope.alerts = [{ type: 'error', msg: 'Please select an industry or client to begin your report template.' }];
            return;
        }

        if ($scope.selectedJurisdiction == undefined) {
            $rootScope.alerts = [{ type: 'error', msg: 'Please select a Jurisdiction to begin your report template.' }];
            return;
        }

        //create new checklist. save locally and then redirect location 
        $scope.Checklist = ChecklistService.create(clientId, siteId, $scope.visitDate, $scope.visitBy, $scope.user, $scope.selectedJurisdiction);

        var questions;
        
        if ($scope.selectedIndustry == undefined) {
            questions = ClientQuestionService.getQuestionsByQuestionsArrayId($scope.selectedBespokeTemplate.Questions);
        } else {
            questions = ClientQuestionService.getQuestionsByQuestionsArrayId($scope.selectedIndustry.Questions);
        }

        $scope.Checklist.ClientDetails = $scope.ClientDetails;
        $scope.Checklist.Site = $rootScope.Site;

        var mandatoryQuestions = filterMandatoryNonDeletedQuestions(questions);

        $scope.Checklist = ChecklistService.addQuestions($scope.Checklist, mandatoryQuestions);
        

        if ($scope.selectedIndustry != undefined) {
            $scope.Checklist.Industry = $scope.selectedIndustry.Title;
            $scope.Checklist.IndustryId = $scope.selectedIndustry.Id;
            $scope.Checklist.SpecialReport = false;
        } else if ($scope.selectedBespokeTemplate) {
            $scope.Checklist.Industry = $scope.selectedBespokeTemplate.Title;
            $scope.Checklist.IndustryId = $scope.selectedBespokeTemplate.Id;
            $scope.Checklist.SpecialReport = $scope.selectedBespokeTemplate.SpecialTemplate; //.toUpperCase() == 'SPECIAL REPORT' ? true : false;
            autoSetChecklistSpecialReportQuestionAnswer();
        }

        var result = ChecklistService.saveToLocalStorage($scope.Checklist);
        if (result == true) {
            $location.path("evaluationchecklists/" + $scope.Checklist.Id);
        }
    };
    
    if ($routeParams.clientAccountNumber != undefined && $routeParams.clientAccountNumber.length > 0) {
        $scope.CAN = $routeParams.clientAccountNumber;
        retrieveClientDetails($scope.CAN);
    } else {
        $scope.CAN = "DEMO002";
    }

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };
    
    $scope.open = function () {
        $timeout(function () {
            $scope.opened = true;
        });
    };

    var autoSetChecklistSpecialReportQuestionAnswer= function() {
        if ($scope.Checklist.SpecialReport) {
            $.each($scope.Checklist.Questions, function (idx) {
                var responseToSelect = $scope.Checklist.Questions[idx].Question.PossibleResponses[idx];
                $scope.Checklist.Questions[idx].Answer.SelectedResponseId = responseToSelect.Id;
            });
        }
    }

    var filterNonDraftTemplates = function (industries) {
        if (industries.length > 0) {
            return $filter('filter')(industries, { "Draft": false });
        }
        else {
            return industries;
        }
    };
    
    var init = function () {
        $rootScope.blockUI();

        ClientQuestionService.getCompleteSetOfQuestions(function (callbackquestions) {
            $window.localStorage.setItem('CompleteSetOfQuestions', JSON.stringify(callbackquestions));
        });

        ChecklistTemplateService.getTemplatesWithOnlyQuestionIds(function (templates) {
            var bespokeTemplates = $filter('filter')(templates, { "TemplateType": "Bespoke" });
            $scope.BespokeTemplates = filterNonDraftTemplates(bespokeTemplates);

            var industryTemplates = $filter('filter')(templates, { "TemplateType": "Industry" });
            $scope.Industries = filterNonDraftTemplates(sortByKey(industryTemplates, 'Title'));

            ClientQuestionService.getCompleteSetOfQuestions(function (data) {
                $scope.CompleteSetOfQuestions = data;

//                $scope.Industries.push({
//                    "Title": "Complete set of questions",
//                    "Deleted": false,
//                    "Draft": false,
//                    "Questions": $scope.CompleteSetOfQuestions
//                });

                $rootScope.unblockUI();
            });


            _removeIndustryTemplatesFromLocalStorage();
        });


    };

    //this method can be removed in a future releases. It is designed to remove the industry templates from local storage because they are replaced with checklist templates. ALP
    var _removeIndustryTemplatesFromLocalStorage = function () {
        for (var key in localStorage) {
            if (key.indexOf('Industry') > -1) {
                $window.localStorage.removeItem(key);
            }
        }
    };

    init();
}



