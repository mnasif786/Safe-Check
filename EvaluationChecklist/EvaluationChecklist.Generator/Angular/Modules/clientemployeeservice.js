angular.module('clientemployeeService', ['configService']).
    factory('ClientEmployeeService', function ($rootScope, $http, ConfigService, $filter, $window) {
        var config = ConfigService.getConfig();

        function getEmployeesFromLocalStorage(clientid) {
            var employees = [];
            if ($window.localStorage.getItem('Employees:' + clientid) != null) {
                employees = JSON.parse($window.localStorage.getItem('Employees:' + clientid));
            }
            return employees;
        }

        var _getEmployees = function (clientid, callback) {

            var employees = [];
            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "GET", url: config.apiUrl + 'clients/' + clientid + '/employees', withCredentials: true }).success(function (data) {
                    data = $filter('orderBy')(data, 'FullName');
                    $window.localStorage.setItem('Employees:' + clientid, JSON.stringify(data));
                    if (callback) {
                        callback(data);
                    }

                }).error(function (data, status, headers) {

                    employees = getEmployeesFromLocalStorage(clientid);
                    if (callback) {
                        callback(employees);
                    }
                });
            }
            else {
                employees = getEmployeesFromLocalStorage(clientid);
                if (callback) {
                    callback(employees);
                }
            }
        };

        return {
            get: _getEmployees
        };
    });