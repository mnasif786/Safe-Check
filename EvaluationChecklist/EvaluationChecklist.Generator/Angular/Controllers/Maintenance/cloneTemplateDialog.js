var  CloneTemplateDialogController = function ($scope, $modalInstance, request, options) {

    $scope.request = request;
    $scope.options = options;

    $scope.ok = function () {
        if($scope.request.Name==''){
            $('div#cloneTemplate input.ng-invalid').focus();
            return;
        }
        $modalInstance.close(request);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};