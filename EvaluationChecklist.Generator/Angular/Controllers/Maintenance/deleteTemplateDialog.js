var deleteTemplateDialogController = function ($scope, $modalInstance, request, options) {
   
    $scope.request = request;
    $scope.options = options;

    $scope.ok = function () {
         $modalInstance.close(request);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};