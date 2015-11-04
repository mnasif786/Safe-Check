angular.module('userService', ['configService']).
    factory('UserService', function ($rootScope, $http, $q, $filter, ConfigService) {
        var config = ConfigService.getConfig();

        var _getUser = function (callback) {
            $http({ method: "GET", url: config.apiUrl + 'maintenanceuser', withCredentials: true }).success(function (data) {
                if (callback) {
                    callback(data);
                }
                else {
                    return JSON.stringify(data);
                }
            }).error(function (data, status, headers) {
                console.log('error getting maintenance user' + status);
            });
        };

        return {
            get: _getUser
        };


    });