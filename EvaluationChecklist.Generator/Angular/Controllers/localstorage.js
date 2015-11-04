function LocalStorageController($scope,$window) {

    $scope.checkForUpdates = function() {
        $window.applicationCache.update();
    };

    $scope.removeFromLocalStorage = function (key) {
        $window.localStorage.removeItem(key);
        $scope.localStorageItems = getLocalStorageItems();
        $scope.localStorageUsed = JSON.stringify(localStorage).length;
    };

    $scope.removeAllFromLocalStorage = function () {
        $window.localStorage.clear();
        $scope.localStorageItems = getLocalStorageItems();
        $scope.localStorageUsed = JSON.stringify(localStorage).length;
    };

    $scope.localStorageUsed = JSON.stringify(localStorage).length;
    
    var getLocalStorageItems = function() {
        var localStorageItems = [];

        for (var key in localStorage) {
            localStorageItems.push({
                "Key": key,
                "Value": localStorage[key],
                "ValueShort": localStorage[key].substring(0,125)
            });

        }
        return localStorageItems;
    };

    $scope.localStorageItems = getLocalStorageItems();
    

 }

