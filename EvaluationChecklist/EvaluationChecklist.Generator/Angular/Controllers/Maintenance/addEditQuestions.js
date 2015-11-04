function AddEditQuestionController($scope, $modalInstance, QuestionService, question, ChecklistTemplateService) {

    $scope.industryMember = [];

    var init = function () {

        $scope.modalAlerts = [];
        $scope.modalAlerts.push({ msg: 'Remember: Editing question text will update all templates and all existing safecheck reports!' });

        if (angular.isDefined(question)) {

            $scope.originalCategory = question.Category;
            $scope.originalCategoryId = question.CategoryId;
            $scope.questionOrderNumber = question.OrderNumber;

            QuestionService.get(question.Id, function (data) {
                $scope.question = data;

                for (var i = 0; i < $scope.categories.length; i++) {
                    if ($scope.categories[i].Id == $scope.question.CategoryId) {
                        $scope.question.CategoryId = $scope.categories[i].Id;
                        $scope.question.Category = $scope.categories[i];
                        break;
                    }
                }
               
                $scope.industries = $.grep(data.IndustryTemplates, function(t) { return t.Deleted == false; });

                $.each($scope.industries, function (idx, industry) {
                    industry.Selected = false;
                });
                if ($scope.question.Industries.IndustryIds.length) {
                    $.each($scope.question.Industries.IndustryIds, function (idx, questionIndustry) {
                        $.each($scope.industries, function (idx, industry) {

                            if (questionIndustry == industry.Id) {
                                industry.Selected = true;
                            }
                        });
                    });
                }

            });
        }
        else {
            ChecklistTemplateService.getAll(function (industries) {
                $scope.industries = $.grep(industries, function (t) { return t.Deleted == false; });
            });

            // create a new question
            $scope.question = {
                Id: guid(),
                Industries: { "IndustryIds": [] },
                AreaOfNonComplianceHeadings: $scope.Headings
            };
            
            QuestionService.getNextQuestionOrderNumber(function (data) {
                $scope.questionOrderNumber = data;
            });
        }
    };


    $scope.save = function () {
        $scope.modalAlerts = [];
        if(!angular.isDefined($scope.question.Category) || $scope.question.Category == null){
            $scope.modalAlerts.push({ type: 'error', msg: 'Section is required.'});
        }
        if(!angular.isDefined($scope.question.Text) || $scope.question.Text ==''){
            $scope.modalAlerts.push({ type: 'error', msg: 'Question text is required.'});
        }

        if(!angular.isDefined($scope.question.AreaOfNonComplianceHeadingId) || ($scope.question.AreaOfNonComplianceHeadingId == null)){
            $scope.modalAlerts.push({ type: 'error', msg: 'Heading is required.'});
        }

        if (isAnyResponseSelected() == false) {
            $scope.modalAlerts.push({ type: 'error', msg: 'At least one of the Response (Acceptable/Unacceptable/Improvement Required/Not Applicable) must be selected.' });
        }

        if($scope.modalAlerts.length){
            return;
        }

        $scope.question.CategoryId = $scope.question.Category.Id;
        $scope.question.Industries.IndustryIds = [];
        $scope.question.OrderNumber = $scope.questionOrderNumber;

        $.each($scope.industries, function (idx, industry) {
            if (industry.Selected == true) {
                $scope.question.Industries.IndustryIds.push(industry.Id);
            }
        });
        $modalInstance.close($scope.question);
    };

    $scope.cancel = function () 
    {
        $scope.question.CategoryId = $scope.originalCategoryId;
        $scope.question.Category = $scope.originalCategory;
        $modalInstance.dismiss('cancel');
    };

    $scope.closeAlert = function(index) {
        $scope.modalAlerts.splice(index, 1);
    };
    
    var isAnyResponseSelected = function () {
        if ((angular.isDefined($scope.question.AcceptableEnabled) && $scope.question.AcceptableEnabled == true) ||
                (angular.isDefined($scope.question.ImprovementRequiredEnabled) && $scope.question.ImprovementRequiredEnabled == true) || 
                    (angular.isDefined($scope.question.NotApplicableEnabled) && $scope.question.NotApplicableEnabled == true) ||
                        (angular.isDefined($scope.question.UnacceptableEnabled) && $scope.question.UnacceptableEnabled == true)) {

            return true;

        } else {
            return false;
        }
    }

    init();
};