﻿angular.module('configService', ['ngResource'])
    .service('ConfigService', function () {
        var _config = {
            apiUrlForNgResource: 'http://10.1.246.96\\:8106/api/',  //need to escape the port number when reference in a service that uses hgResource
            apiUrl: 'api/',
            version: 'versionNumber'
        };
        function _getConfig() {
            return _config;
        }
        return {
            getConfig: _getConfig
        };
    });