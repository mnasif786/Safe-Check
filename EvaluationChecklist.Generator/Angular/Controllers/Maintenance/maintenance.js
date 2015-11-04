function MaintenanceController($rootScope, $scope, $timeout, ClientQuestionService, CategoryService, QuestionService, $modal, ChecklistTemplateService, AccountService, ConsultantService, ExecutiveSummaryService, $filter) {
    $scope.showAddedQuestions = false;
    $scope.setActiveTab = null;
    $scope.showDeleted = false;
    $scope.selectedTemplate = null;
    $scope.questionTemplate = null;
    $scope.setActiveTab = "tabQuestions";
    $scope.nextQaAdvisorToBeAssignedReports = null;
    $scope.previousQaAdvisorToBeAssignedReports = null;
    $scope.selectedCategory = null;
    $scope.selectedIndustry = null;
    $scope.selectedBespoke = null;
    $scope.addNewConsultantButtonDisabled = false;

    $scope.init = function () {
        CategoryService.get(function (data) {
            $scope.categories = data;

            // NB: This is a fix for known issue with Angular select binding
            if ($scope.selectedCategory != undefined && $scope.categories != undefined) {
                for (var i = 0; i < $scope.categories.length; i++) {
                    if ($scope.categories[i].Id == $scope.selectedCategory.Id) {
                        $scope.selectedCategory = $scope.categories[i];
                        break;
                    }
                }
            }
        });

        ClientQuestionService.getCompleteSetOfQuestions(function (data) {
            $scope.questions = data;
        });

        getBespokeTemplates();
        getIndustryTemplates();

        AccountService.getQaAdvisors(function (data) {
            $scope.advisors = data;
        });

        ConsultantService.getConsultants(function (data) {
            $scope.consultants = data;
        });

        AccountService.getNextQaAdvisorInRotation(function (data) {
            $scope.nextQaAdvisorToBeAssignedReports = data;
        });

        AccountService.getPreviousQaAdvisorInRotation(function (data) {
            $scope.previousQaAdvisorToBeAssignedReports = data;
        });

       // var test = $rootScope.isOnlineAndWorkingOnline($window);


        $scope.reportTemplates = ExecutiveSummaryService.getTemplates();

        $scope.Headings = [];
        QuestionService.getHeadings().then(function(result) {
            if (result.success && result.data.length) {
                $scope.Headings = result.data;
            }
        });


        $scope.predicate = 'OrderNumber';
        $scope.reverse = false;

    };

    $scope.GetMandatoryText = function(isMandatory) {
        return isMandatory === true ? 'Mandatory' : 'Non Mandatory';
    };

    $scope.AddEditQuestion = function (Question) {
        var modalInstance = $modal.open({
            scope: $scope,
            windowClass: "maintenancemodal scroll",
            templateUrl: 'angular/partials/maintenance/_question.htm',
            controller: AddEditQuestionController,
            resolve: {
                question: function() {
                    return Question;
                }
            }
        });

        modalInstance.result.then(function (updatedQuestion) 
        {
            $scope.SaveQuestion(updatedQuestion).then(function(){
                $scope.init();
            });
            
        }, function () {

        });
    };

    $scope.archiveQuestion = function (Question) {
        console.log('ArchiveQuestion called');
        $scope.question = Question;

        $scope.options = {
            'title': 'Archive question',
            'prompt': 'Are you sure you want to archive this question?',
            'ok': 'Yes',
            'cancel': 'No'
        };
        var confirmDialog = $modal.open({
            scope: $scope,
            windowClass: "modal small",
            templateUrl: 'angular/partials/maintenance/confirmDialog.htm',
            controller: ConfirmDialogController,
            resolve: {
                question: function () {
                    return $scope.question;
                },
                options: function () {
                    return $scope.options;
                }
            }
        });

        confirmDialog.result.then(function (updatedQuestion) {
            updatedQuestion.Deleted = true;

            $($scope.questions).each(function (index, question) {
                if (question.Id == updatedQuestion.Id) {
                    question.Deleted = true;
                    return false;
                }
            });

            // Need to initialise these when archiving a question. Otherwise, responses are also archived and don't show up in 
            // existing checklists
            $.each(updatedQuestion.PossibleResponses, function (index, response) {
                if (response.Title == "Not Applicable") { updatedQuestion.NotApplicableEnabled = !response.Deleted; }
                if (response.Title == "Unacceptable") { updatedQuestion.UnacceptableEnabled = !response.Deleted; }
                if (response.Title == "Acceptable") { updatedQuestion.AcceptableEnabled = !response.Deleted; }
                if (response.Title == "Improvement Required") { updatedQuestion.ImprovementRequiredEnabled = !response.Deleted; }
            });

            $scope.SaveQuestion(updatedQuestion);

        }, function () {
            //Cancel clicked.
        });
    };

    $scope.SaveQuestion = function (question) {
        var promise = QuestionService.saveQuestion(question);
        if (promise != undefined) {
            promise.then(function (result) {
                $.each($scope.questions, function (idx, item) {
                    if (item.Id == question.Id) {
                        item.Text = question.Text;
                        item.Category = question.Category;
                        item.Mandatory = question.Mandatory;
                        return false;
                    }
                });

                $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg}];
            });
        }
        return promise;
    };

    $scope.SaveTemplateQuestion = function(question) {
        
    };

    $scope.filterQuestions = function(question){

        return (($scope.showDeleted && question.Deleted) || (!$scope.showDeleted && !question.Deleted)) && ($scope.selectedCategory == null || question.CategoryId == $scope.selectedCategory.Id);
    };

    $scope.filterQuestionsForTemplate = function(question){
   
        return (($scope.showDeleted && question.Deleted) || (!$scope.showDeleted && !question.Deleted)) && question.Selected;
    };
    
    $scope.setTemplateDraftStatus = function (status) 
    {        
        $scope.selectedTemplate.Draft = status;
        return ChecklistTemplateService.updateTemplate($scope.selectedTemplate.id, $scope.selectedTemplate);       
    };

    $scope.ActivateTemplate = function () {
        console.log('ActivateTemplate called');

        // if user clicks to make activated template non-activated, don't show dialog
        if ($scope.selectedTemplate.Draft == true) {
            $scope.setTemplateDraftStatus(true);
            return;
        }

        $scope.options =
        {
            'title': 'Activate Template',
            'prompt': 'Would you like to activate this template?',
            'ok': 'Activate',
            'cancel': 'Cancel'
        };

        var confirmDialog = $modal.open({
            scope: $scope,
            windowClass: "modal small",
            templateUrl: 'angular/partials/maintenance/confirmDialog.htm',
            controller: ActivateTemplateDialogController,
            resolve:
            {
                industry: function () {
                    return $scope.selectedTemplate;
                },

                options: function () {
                    return $scope.options;
                }
            }
        });

        confirmDialog.result.then(function (result) {
            var promise = $scope.setTemplateDraftStatus(false);
            promise.then(function(draftResult) {
                $rootScope.alerts = [{ type: draftResult.success ? 'success' : 'error', msg: draftResult.msg }];
            });
        },
        function () {
            //Cancel clicked.

            $scope.setTemplateDraftStatus(true);
        });
    };             
      
    $scope.industryChanged = function () {
        if ($scope.selectedIndustry != null) {
            $scope.selectedBespoke = null;
            $scope.selectedTemplate = $scope.selectedIndustry;

            loadTemplate($scope.selectedTemplate);
        }
        else 
        {
            // changed selection to null, so template must be null
            $scope.selectedTemplate = null;
            $scope.questionTemplate = null;
        }
    };

    $scope.bespokeChanged = function () {
        if ($scope.selectedBespoke != null) {
            $scope.selectedIndustry = null;           
            $scope.selectedTemplate = $scope.selectedBespoke;         
           loadTemplate($scope.selectedTemplate);
       } else 
        {
           // changed selection to null, so template must be null
            $scope.selectedTemplate = null;
            $scope.questionTemplate = null;
        }
    };

    var loadTemplate = function(template) {
        $.each($scope.questions, function(idx, question) {
            question.Selected = isQuestionInQuestionArray(question, template.Questions);
            question.Excluded = false;
            question.Remove = false;// reset remove flag so checkboxes do not remain checked when selected new template
        });
    };

    var isQuestionInQuestionArray = function(questionToFind, questionArray) {
        var result = false;
        $.each(questionArray, function(idx, question) {
            if (questionToFind.Id == question.Id) {
                result = true;
                return false; //return false to exit the each array;
            }
        });

        return result;
    };

    function refreshTemplates(request) {
        if (request.TemplateType == 1) {
            getIndustryTemplates(function () {

                $($scope.industries).each(function (index, industry) {
                    if (industry.Title == request.Name) {
                        $scope.selectedIndustry = industry;
                        return false;
                    }
                });

                $scope.industryChanged();
            });
        }
        else if (request.TemplateType == 2) {
            getBespokeTemplates(function () {
                $($scope.BespokeTemplates).each(function (index, bespoke) {
                    if (bespoke.Title == request.Name) {
                        $scope.selectedBespoke = bespoke;
                        return false;
                    }
                });

                $scope.bespokeChanged();
            });
        }
    }

    $scope.cloneTemplate = function () {
        console.log('cloneTemplate called');

        $scope.cloneRequest = {
            Id: $scope.selectedTemplate.Id,
            Name:'',
            Clone:true,
            TemplateType : $scope.selectedTemplate.TemplateType == 'Industry' ? 1 : 2
        };

        $scope.options = {
            'title': 'Clone Template',
            'prompt': $scope.selectedTemplate.Title,
            'ok': 'Clone',
            'cancel': 'Cancel'
        };
        var cloneDialog = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/maintenance/cloneTemplateDialog.htm',
            controller: CloneTemplateDialogController,
            resolve: {
                request: function() {
                    return $scope.cloneRequest;
                },
                options: function() {
                    return $scope.options;
                }
            }
        });


        cloneDialog.result.then(function (request) {
            ChecklistTemplateService.cloneTemplate(request.Id, request.TemplateType, request.Name).then(function(result){
                // refresh view and select cloned template
                if(result.success){
                    refreshTemplates(request);
                }
                $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg}];
            });

        }, function () {
            //Cancel clicked.
        });
    };

    $scope.renameTemplate = function () {
        console.log('rename template called');

        $scope.request = {
            Id: $scope.selectedTemplate.Id,
            Name:'',
            Clone:false,
            TemplateType : $scope.selectedTemplate.TemplateType == 'Industry' ? 1 : 2
        };

        $scope.options = {
            'title': 'Rename Template',
            'prompt': $scope.selectedTemplate.Title,
            'ok': 'Rename',
            'cancel': 'Cancel'
        };
        var cloneDialog = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/maintenance/cloneTemplateDialog.htm',
            controller: CloneTemplateDialogController,
            resolve: {
                request: function() {
                    return $scope.request;
                },
                options: function() {
                    return $scope.options;
                }
            }
        });
            

        cloneDialog.result.then(function (request) {
            ChecklistTemplateService.renameTemplate(request.Id, request.Name).then(function(result){
                // refresh view and select cloned template
                if(result.success){
                    refreshTemplates(request);
                }
                $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg}];
            });

        }, function () {
            //Cancel clicked.
        });
    };

    $scope.RemoveQuestionsFromTemplate = function () {

        $scope.options = {
            'title': 'Remove Question(s)',
            'prompt': 'Are you sure you want to remove the selected question(s) from this template?',
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
                    return null;
                },
                options: function() {
                    return $scope.options;
                }
            }
        });

        confirmDialog.result.then(function () {

            var template = $scope.selectedIndustry != null ? $scope.selectedIndustry :
                $scope.selectedBespoke != null ? $scope.selectedBespoke : null;

            $($scope.questions).each(function (index, q) {
                if (q.Remove && q.Selected) {
                    q.Selected = false;
                    var exclude = !q.Selected;

                    console.log('Removing question' + q.Id + 'from template ' + template.Title);

                    ChecklistTemplateService.updateTemplateQuestion(template.Id, q, exclude).then(function (result) {
                        template.Questions.push(q);
                    });
                }
            });
        }, function () {
            //Cancel clicked.
        });
    };

    $scope.showAddQuestionsToTemplateModal = function (category) {

        var template = $scope.selectedIndustry != null ? $scope.selectedIndustry :
            $scope.selectedBespoke != null ? $scope.selectedBespoke : null;

        var questions = $filter('filter')($scope.questions, function (item) {
            return !item.Selected && item.CategoryId == category.Id;
        });

        var modalInstance = $modal.open({
            scope: $scope,
            windowClass: "modal scroll",
            templateUrl: 'angular/partials/maintenance/addquestionstotemplate.htm',
            controller: AddQuestionsToTemplateController,
            resolve:
            {
                template: function ()
                {
                    return template;
                },
                questions: function ()
                {
                    return questions;
                }
            }
        });

        modalInstance.result.then(function (questions)
        {
            $scope.showAddedQuestions=true;

            var template = $scope.selectedIndustry != null ? $scope.selectedIndustry :
                $scope.selectedBespoke != null ? $scope.selectedBespoke : null;

            $(questions).each(function (index, q) {
                if (q.Selected) {
                    console.log('Adding question ' + q.Id + 'to template ' + template.Title);
                    var exclude = !q.Selected;
                    ChecklistTemplateService.updateTemplateQuestion(template.Id, q, exclude).then(function (result) {
                        template.Questions.push(q);
                    });
                }
            });

            $timeout(function(){
                    $scope.showAddedQuestions=false;
                    $(questions).each(function (index, q) {
                        q.Added = false;
                    });

            }, 5000);

        },
        function () {

        });
    };

    function getBespokeTemplates(callback) {
        ChecklistTemplateService.getBespokeTemplates(function (data) {
            $scope.BespokeTemplates = sortByKey(data, 'Title');
            if(callback){
                callback();
            }
        });
    }

    function getIndustryTemplates(callback) {
        ChecklistTemplateService.getIndustryTemplates(function (data) {
            $scope.industries = sortByKey(data, 'Title');
            if(callback){
                callback();
            }
        });
    }

    $scope.updateAdvisor = function (advisor) {
        var promise = AccountService.saveQaAdvisor(advisor);
        promise.then(function (result) {
            if(result.success==false){
                $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
            }

            //update the next advisor
            AccountService.getNextQaAdvisorInRotation(function (data) {
                $scope.nextQaAdvisorToBeAssignedReports = data;
            });

            AccountService.getPreviousQaAdvisorInRotation(function (data) {
                $scope.previousQaAdvisorToBeAssignedReports = data;
            });
        });
    };
    
    $scope.updateConsultant = function (consultant) {
        //if qa advisorassigned than blacklisted need to be true
        if (!IsNullOrUndefined(consultant.QaAdvisorAssigned)) {
            consultant.Blacklisted = true;
        }
    var promise = ConsultantService.saveConsultant(consultant);
        promise.then(function (result) {
            if (result.success == false) {
                $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
            }
        });
    };

    $scope.MoveQuestionUpOnePosition = function (question) {
        // get relevant questions with lower order no 
        var results = $filter('filter')($scope.questions, function (item) {
           return item.OrderNumber < question.OrderNumber && item.CategoryId == question.CategoryId && item.Deleted == false && item.Selected;
        });

        // order to get the last one (one question closest to)
        results = $filter('orderBy')(results, 'OrderNumber');

        if (results.length == 0)
            return;
            
        var lastQuestion = results[results.length - 1];

        arrangeNewQuestionOrder(question, lastQuestion);
    };

    $scope.MoveQuestionDownOnePosition = function (question) {
        // get relevant questions with lower order no 
        var results = $filter('filter')($scope.questions, function (item) {
            return item.OrderNumber > question.OrderNumber && item.CategoryId == question.CategoryId && item.Deleted == false && item.Selected;
        });

        results = $filter('orderBy')(results, 'OrderNumber');

        if (results.length == 0)
            return;
            
        var lastQuestion = results[0];

        arrangeNewQuestionOrder(question, lastQuestion);
    };

    function arrangeNewQuestionOrder(question, lastQuestion) {
        var tempOrderNo = lastQuestion.OrderNumber;
        var position = 0;

        // find question to be swapped in array and update with new order
        $.each($scope.questions, function (idx, currentQuestion) {
            if (lastQuestion.Id == currentQuestion.Id) {
                $scope.questions[position].OrderNumber = question.OrderNumber;
            }

            position++;
        });

        position = 0;

        // find question in array and update with its new order no.
        $.each($scope.questions, function (idx, currentQuestion) {
            if (question.Id == currentQuestion.Id) {
                $scope.questions[position].OrderNumber = tempOrderNo;
            }

            position++;
        });
    };

    $scope.saveQuestionOrder = function () {

        var questionOrder = new Array();

        $.each($scope.questions, function(idx, question) {
            var orderObject = {
                "QuestionId": question.Id,
                "OrderNumber": question.OrderNumber
            };
            questionOrder.push(orderObject);
        });

        var promise = QuestionService.saveQuestionOrder(questionOrder).then(function (result) {
            $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
        });
    };

    $scope.setSelected = function(question) {
        $scope.selectedQuestionId = question.Id;
    };
    

    $scope.clear = function(){
        $scope.selectedCategory = null;
    };

    $scope.displayCategoryTabs = function() {
        if ($scope.selectedTemplate == null)
            return true;
        else 
            return false;
    };

    $scope.deleteTemplate = function() {

        $scope.request = {
            Id: $scope.selectedTemplate.Id,
            Name: '',
            Clone: false,
            TemplateType: $scope.selectedTemplate.TemplateType == 'Industry' ? 1 : 2
        };

        $scope.options = {
            'title': 'Delete Template - ' + $scope.selectedTemplate.Title,
            'prompt': 'Do you want to delete this SafeCheck template?',
            'ok': 'Yes',
            'cancel': 'No'
        };
        var deleteTemplateDialog = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/maintenance/confirmDialog.htm',
            controller: deleteTemplateDialogController,
            resolve: {
                request: function () {
                    return $scope.request;
                },
                options: function () {
                    return $scope.options;
                }
            }
        });

        deleteTemplateDialog.result.then(function (request) {
            ChecklistTemplateService.deleteTemplate($scope.selectedTemplate.Id).then(function (result) {
                refreshTemplates(request);
                $scope.selectedIndustry = null;
                $scope.selectedBespoke = null;

            $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
            });

        }, function () {
            //Cancel clicked.
        });

    };

 $scope.deleteConsultant = function (consultant) {
        $scope.options = {
            'title': 'Delete consultant',
            'prompt': 'Are you sure you want to delete the consultant ' + consultant.Fullname + '?',
            'ok': 'Yes',
            'cancel': 'No'
        };

        var confirmDialog = $modal.open({
            windowClass: "modal small",
            templateUrl: 'angular/partials/maintenance/confirmDialog.htm',
            controller: ConfirmDeleteConsultantDialogController,
            resolve: {
                options: function () {
                    return $scope.options;
                },
                consultant: function() {
                    return consultant;
                }
            }
        });

        confirmDialog.result.then(function (deletedConsultant) {
            console.log('delete consultant');
            console.log(deletedConsultant);

            var promise = ConsultantService.deleteConsultant(deletedConsultant);
            promise.then(function (result) {
                if (result.success == true) {
                    $($scope.consultants).each(function (index, consultantItem) {
                        if (consultantItem.Id == deletedConsultant.Id) {
                            $scope.consultants.splice(index, 1);
                        }
                    });
                }

                $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg }];
            });

        }, function () {
            //Cancel clicked.
        });
    };

    $scope.addConsultant = function (username) {

        $scope.addNewConsultantButtonDisabled = true;

        var promise = ConsultantService.addConsultant(username);
        promise.then(function (result) {
            if (result.success == true) 
            {
                ConsultantService.getConsultants(function (data) {
                    $scope.consultants = data;
                });

                $scope.newConsultantUsername = "";              
            }

            $rootScope.alerts = [{ type: result.success ? 'success' : 'error', msg: result.msg}];

            $scope.addNewConsultantButtonDisabled = false;
        });

    };

    $scope.init();
}
