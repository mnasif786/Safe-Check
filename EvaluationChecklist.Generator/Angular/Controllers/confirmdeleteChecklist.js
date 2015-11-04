var ConfirmDeleteChecklistController = function ($scope, $modalInstance) {
    console.log('ConfirmDeleteChecklistController start');
    $scope.ok = function() {
        $modalInstance.close('OK');
    };
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};