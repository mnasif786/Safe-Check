var CopyChecklistController = function ($scope, $modalInstance, $location, clientAccountNumber, site) {
    $scope.site = site;
    $scope.copyOption = {"Value": ""};
    
    $scope.ok = function () {
        $modalInstance.close({
            "CopyOption": $scope.copyOption.Value,
            "SiteId": $scope.site.Id,
            "ClientAccountNumber": clientAccountNumber,
            "ChecklistId": $scope.site.Checklist.Id
    });

    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

}
