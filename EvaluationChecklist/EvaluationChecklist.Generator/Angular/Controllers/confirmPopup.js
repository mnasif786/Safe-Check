var ConfirmPopupController = function ($scope, $modalInstance) {
    console.log('ConfirmPopupController start');
    $scope.deleteRecordIRN = function (immediate) {
        var index = $scope.Checklist.ImmediateRiskNotifications.indexOf(immediate);
        $scope.Checklist.ImmediateRiskNotifications.splice(index, 1);
        $scope.save();
        $modalInstance.dismiss('deletedIRN');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

};