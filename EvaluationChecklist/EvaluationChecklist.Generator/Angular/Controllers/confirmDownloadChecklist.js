var ConfirmDownloadChecklistController = function ($scope, $routeParams, $modalInstance, options) {
    console.log('ConfirmDownloadChecklistController start');
    $scope.title = options.title;
    $scope.message = options.message;
    $scope.unblockUI();

    $scope.ok = function () {
        $modalInstance.close('put something here');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};