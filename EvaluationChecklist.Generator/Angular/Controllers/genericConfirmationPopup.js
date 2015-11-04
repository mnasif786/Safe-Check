var GenericConfirmationPopupController = function ($rootScope, $scope, $modalInstance, Options) {

    $scope.options = Options;
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};