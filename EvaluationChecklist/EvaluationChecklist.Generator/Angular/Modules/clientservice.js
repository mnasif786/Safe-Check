angular.module('clientServiceREST', ['configService']).
    factory('ClientServiceREST', function ($http, ConfigService) {
        var config = ConfigService.getConfig();

        var _query = function (queryValue, callback) {
            $http({ method: "GET", url: config.apiUrl + 'clients/query/' + queryValue, withCredentials: true }).success(callback).error(callback);
        }

        var _get = function (clientId, callback) {
            $http({ method: "GET", url: config.apiUrl + 'clients/' + clientId, withCredentials: true }).success(callback).error(callback);
        }

        return {
            query: _query,
            get: _get
        };
        
    });