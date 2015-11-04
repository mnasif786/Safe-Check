angular.module('impressiontypeservice', ['configService']).
    factory('ImpressionTypeService', function ($http, ConfigService) {
        var config = ConfigService.getConfig();

        var _getImpressionTypes = function (callback) {

            var impressiontypes; // = [];

            for (var key in localStorage) {
                if (key.indexOf('ImpressionTypes') > -1) {
                    //impressiontypes.push(JSON.parse(localStorage.getItem(key)));
                    impressiontypes = JSON.parse(localStorage.getItem(key));
                }
            }

            if (impressiontypes != undefined) {
                callback(impressiontypes);
            }
            else {
                $http({ method: "GET", url: config.apiUrl + 'impressions', withCredentials: true }).success(function (data) {
                    localStorage.setItem('ImpressionTypes', JSON.stringify(data));
                    if (callback) {
                        callback(data);
                    } else {
                        return data;
                    }
                }).error(function (data, status, headers) {
                    console.log('error getting impressiontypes' + status);
                });

            }

        };

        var _getIRN = function (callback) {
            _getImpressionTypes(function (impressiontypes) {
                for (var i = 0; i < impressiontypes.length; i++) {
                    if (impressiontypes[i].Title == 'IRN served - Urgent Action') {
                        if (callback) {
                            callback(impressiontypes[i]);
                        }
                        else {
                            return impressiontypes[i];
                        }
                    }
                }
            });
        };

        return {
            get: _getImpressionTypes,
            getIRNImpressionType: _getIRN

        };
    });