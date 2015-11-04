

var DeleteLetterConfirmationController = function ($scope, $routeParams, $modalInstance) {
    console.log('DeleteLetterConfirmationController start' + localStorage["letterTemplateTitle" + $routeParams.Id]);

    $scope.letterTemplateTitle = localStorage["letterTemplateTitle" + $routeParams.Id];

    $scope.ok = function () {
        $modalInstance.close('put something here');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };



};