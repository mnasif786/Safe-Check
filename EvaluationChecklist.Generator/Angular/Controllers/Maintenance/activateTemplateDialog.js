var ActivateTemplateDialogController = function ($scope, $modalInstance, industry, options) {

    $scope.industry = industry;
    $scope.options = options;

    $scope.ok = function () {
        $modalInstance.close($scope.industry);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};