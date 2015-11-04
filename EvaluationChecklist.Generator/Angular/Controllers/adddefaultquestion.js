var DefaultQuestionController = function ($rootScope, $scope, $modalInstance, ChecklistService, IndustryService, ClientQuestionService, checklist, category, ChecklistTemplateService) 
{
    $scope.questions = [];
    $scope.Category = category;

    var keys = {
        industry: 'Industry:',
        client: 'clientquestions:',
        complete: 'CompleteSetOfQuestions'
    };

    var questionKey = "";

    var filterQuestions = function (questions) 
    {
        //filter the list of questions to those not currently in the checklist
        $.each(questions, function (idx, question) {
            if (question.Category.Id == category.Id) {
                var found = false;

                $.each(checklist.Questions, function (idx, currentQuestion) {
                    if (question.Id == currentQuestion.Question.Id) {
                        found = true;
                        return false;
                    }
                });

                if (!found) {
                    $scope.questions.push(question);
                }
            }
        });
    };

        if (checklist.IndustryId != undefined && checklist.IndustryId !=null)
        {
            ChecklistTemplateService.get(checklist.IndustryId, function (checklistTemplate) {
                filterQuestions(checklistTemplate.Questions);
            });
        }
        else 
        {            
            if (checklist.Industry != undefined && checklist.Industry != 'Complete set of questions')
            {
                IndustryService.getIndustry(checklist.Industry, function(industryQuestions)
                {
                    filterQuestions(industryQuestions.Questions);
                });
            }
            else
            {
                ClientQuestionService.getCompleteSetOfQuestions(function (questions) 
                {
                    filterQuestions(questions);
                });
            }            
        }        
  
  
    $scope.ok = function () {

        // build a list of questions to add into the checklist based on selected value
        var questionsToAdd = [];
        $.each($scope.questions, function (idx, question) {
            if (question.Selected != undefined && question.Selected == true) {
                questionsToAdd.push(question);
            }
        });

        if (questionsToAdd.length) {
            ChecklistService.addQuestions(checklist, questionsToAdd);
        }

        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};