angular.module('categoryService', ['configService']).
    factory('CategoryService', function ($rootScope, $http, $q, $filter, ConfigService) {
        var config = ConfigService.getConfig();

        var _getCategories = function (callback) {
            $http({ method: "GET", url: config.apiUrl + 'categorylist', withCredentials: true }).success(function (data) {
                if (callback) {
                    callback(data);
                }
                else {
                    return data;
                }
            }).error(function (data, status, headers) {
                console.log('error getting categories' + status);
            });
        };
        
        return {
            get: _getCategories
        };


    });