var AddQuestionsToTemplateController = function ($rootScope, $scope, $modalInstance, template, questions)
{
    $scope.template = template;
    $scope.questions = questions;

    $scope.ok = function () {
        $($scope.questions).each(function(index, q){
            if(q.Selected){
                q.Added=true;
                q.Remove=false;
            }
        });
        $modalInstance.close($scope.questions);
    };

    $scope.cancel = function () {

        $($scope.questions).each(function(index,q){
            q.Selected = false;
        });
        $modalInstance.dismiss('cancel');
    };
};