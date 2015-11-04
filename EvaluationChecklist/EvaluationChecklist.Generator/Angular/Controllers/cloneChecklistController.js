var CloneChecklistController = function ($scope, $rootScope, $modalInstance, $location, $filter, ClientServiceREST) {
    $scope.ClientDetails = null;
    $scope.Sites = [];
    $scope.CAN = { "Value": "" };    
    $scope.cloneOption = { "Value": "WithoutResponses" };

    $scope.retrieveClientDetails = function () {

        $rootScope.blockUI();
        ClientServiceREST.query($scope.CAN.Value, function (clientDetailsData) {
            $scope.ClientDetails = null;
            $scope.Sites = [];
            $scope.ClientDetails = clientDetailsData;

            var newSites = [];
            angular.forEach(clientDetailsData.Sites, function (site) {
                if (site.Checklist.Id == null || site.Checklist.Status == 'Submitted') 
                {
                    var newSite = site;
                    newSite.selected = false;

                    newSites.push(newSite);
                }
            });

            $scope.Sites = newSites;
            $rootScope.unblockUI();            
        });
    };

    $scope.siteListUnavailable = function () {
        return ($scope.Sites.length == 0);
    };

    $scope.ok = function () {
        var filteredSites = $filter('filter')($scope.Sites, { "selected": true });

        var filteredSiteIDs = [];
        angular.forEach(filteredSites, function (site) {
            filteredSiteIDs.push(site.Id);
        });

        $modalInstance.close({
            "ClientId": $scope.ClientDetails.Id,
            "SelectedSiteIDs": filteredSiteIDs,
            "WithResponses": ($scope.cloneOption.Value == "WithResponses")              
        });
    };
           

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

}
