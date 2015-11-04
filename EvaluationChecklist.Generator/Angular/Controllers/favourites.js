var FavouritesController = function ($rootScope, $scope, $modalInstance) {

    $scope.Favourites = {"Title": null};

    $scope.ok = function () {
        if ($scope.validateResponse()) {
            $modalInstance.close($scope.Favourites.Title);
        }
    }; 
    
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.validateResponse = function () {
        $scope.validationMessages = [];

        if (!angular.isDefined($scope.Favourites.Title) || isNullOrEmptyString($scope.Favourites.Title)) {
            $scope.validationMessages.push({ type: 'error', msg: 'Please provide a title.' });
            return false;
        }
        return true;
    };

    $scope.closeAlert = function (index) {
        $scope.validationMessages.splice(index, 1);
    };
   
};