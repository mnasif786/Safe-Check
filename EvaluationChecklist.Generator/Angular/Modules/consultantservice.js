angular.module('consultantService',[]).
    factory('ConsultantService', function($http, $q, ConfigService) {

    var config = ConfigService.getConfig();

    var _getConsultants = function(callback) {
        $http({ method: "GET", url: config.apiUrl + 'consultants', withCredentials: true }).success(function(data) {
            callback(data);

        }).error(function(data, status, headers) {
            console.log('error getting consultants' + status);
        });

    };

    var _saveConsultant = function(consultant) {
        var deferred = $q.defer();

        $http({ method: "POST", url: config.apiUrl + 'consultants', data: consultant, withCredentials: true })
            .success(function() {
                deferred.resolve({ success: true, msg: 'Consultant successfully saved.' });
            })
            .error(function(data, status, headers, config) {
                deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to update consultant details' });
            });

        return deferred.promise;
    };

    var _deleteConsultant = function(consultant) {
        var deferred = $q.defer();

        $http({ method: "DELETE", url: config.apiUrl + 'consultants/' + consultant.Id,  withCredentials: true })
            .success(function () {
                deferred.resolve({ success: true, msg: 'Consultant successfully deleted.' });
            })
            .error(function (data, status, headers, config) {
                deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to delete consultant' });
            });

        return deferred.promise;
    };

    var _addConsultant = function (username) {
        var deferred = $q.defer();

        $http({ method: "PUT", url: config.apiUrl + 'consultants/' + username, withCredentials: true })
            .success(function () {
                deferred.resolve({ success: true, msg: 'Consultant successfully added.' });
            })
            .error(function (data, status, headers, config) {
                deferred.resolve({ success: false, msg: JSON.parse(data) });
            });

        return deferred.promise;
    };

    return {
        getConsultants: _getConsultants,
        saveConsultant: _saveConsultant,
        deleteConsultant: _deleteConsultant,
        addConsultant: _addConsultant
    };

});