function User(domain, firstname, surname, email) {
    this.domain = domain;
    this.firstname = firstname;
    this.surname = surname;
    this.role = '';
    this.email = '';

    if (email == null || email == '') {
        this.email = this.firstname + '.' + this.surname + '@peninsula-uk.com';
    } else {
        this.email = email;
    }


    User.prototype.fullname = function() {
        return this.firstname + ' ' + this.surname;
    };

    User.prototype.toJsonString = function() {
        return JSON.stringify(this);
    };

}

angular.module('accountService', []).
    factory('AccountService', function ($rootScope, $http, $q, $window, ConfigService) {
        var key = 'sc-user';
        var config = ConfigService.getConfig();

        function getAccountFromLocalStorage() {
            var result = null;
            if ($window.localStorage.getItem(key)) {
                var data = JSON.parse($window.localStorage.getItem(key));
                result = new User(data.domain, data.firstname, data.surname, data.email);
                result.role = data.role;
            }
            return result;
        }

        var _getAccount = function (callback) {
            var user = new User('', 'unknown', 'user');

            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http.get('/account').success(function (data) {
                    user = new User(data.domain, data.firstname, data.surname, data.email);

                    _getRoleForUser(function (roleData) {
                        user.role = roleData;

                        $window.localStorage.setItem(key, user.toJsonString());

                        if (callback) {
                            callback(user);
                        }

                    }, user);


                }).error(function (data, status, headers) {
                    console.log('error getting account from server' + status);

                    if (status == 401 || status ==0) { //safari ipad returns status 0
                        alert("User not authenticated. Restart browser and enter user credentials.");
                    }

                    user = getAccountFromLocalStorage();
                    if (callback) {
                        callback(user);
                    }
                });
            }
            else {
                if (callback) {
                    user = getAccountFromLocalStorage();
                    callback(user);
                }
            }
        };


        var _getRoleForUser = function (callback, user) {
            var role = _getRoles().consultant;

            $(_getQaAdvisors(function (data) {

                $(data).each(function (idx, advisor) {
                    if (advisor.Fullname == user.fullname()) {
                        role = _getRoles().qa;
                        return false;
                    }
                });
                callback(role); ;
            }));


        };

        var _getQAdvisorsFromLocalStorage = function () {
            if ($window.localStorage.getItem("Advisors") != null) {
                return JSON.parse($window.localStorage.getItem('Advisors'));
            }

            return null;
        };

        var _getQaAdvisors = function (callback) {

            var advisors = [];
            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "GET", url: config.apiUrl + 'advisors', withCredentials: true }).success(function (data) {
                    advisors = data;
                    $window.localStorage.setItem('Advisors', JSON.stringify(data));
                    callback(data);
                }).error(function (data, status, headers) {
                    console.log('error getting advisors' + status);
                    advisors = _getQAdvisorsFromLocalStorage();
                    callback(advisors);
                });
            }
            else {
                advisors = _getQAdvisorsFromLocalStorage();
                callback(advisors);
            }

            return advisors;
        };

        var _getRoles = function () {
            var roles = {
                consultant: 'Consultant',
                qa: 'QA'
            };

            return roles;
        };

        var _saveQaAdvisor = function (qaAdvisor) {
            var deferred = $q.defer();

            $http({ method: "POST", url: config.apiUrl + 'advisors', data: qaAdvisor, withCredentials: true })
                .success(function () {
                    deferred.resolve({ success: true, msg: 'Advisor successfully saved.' });
                })
            .error(function (data, status, headers, config) {
                deferred.resolve({ success: false, msg: 'An error has occurred.  Unable to update advisor details' });
            });

            return deferred.promise;

        }

        var _getNextQaAdvisor = function (callback) {

            $http({ method: "GET", url: config.apiUrl + 'advisors/nextQaAdvisorInRotation', withCredentials: true })
             .success(function (data) {
                 callback(data);
             })
         .error(function (data, status, headers, config) {
             console.log('error getting next QaAdvisor' + status);
         });
        }

        //returns the last advisor assigned to a checklist
        var _getPreviousQaAdvisor = function (callback) {

            $http({ method: "GET", url: config.apiUrl + 'advisors/previousQaAdvisorInRotation', withCredentials: true })
             .success(function (data) {
                 callback(data);
             })
         .error(function (data, status, headers, config) {
             console.log('error getting previous QaAdvisor' + status);
         });
        }

        return {
            get: _getAccount,
            getQaAdvisors: _getQaAdvisors,
            getRoles: _getRoles,
            getNextQaAdvisorInRotation: _getNextQaAdvisor,
            getPreviousQaAdvisorInRotation: _getPreviousQaAdvisor,
            saveQaAdvisor: _saveQaAdvisor
        };

    });