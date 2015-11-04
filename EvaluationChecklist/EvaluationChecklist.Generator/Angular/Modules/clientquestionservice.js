angular.module('clientQuestionService', ['configService']).
    factory('ClientQuestionService', function ($rootScope, $http, $filter, ConfigService, $q, $window) {
        var config = ConfigService.getConfig();

        var _getClientQuestions = function(callback) {
            $http({ method: "GET", url: config.apiUrl + 'client/questions', withCredentials: true }).success(function(data) {
                $.each(data, function(idx, clientQuestion) {
                    localStorage.setItem('clientquestions:' + clientQuestion.ClientAccountNumber, JSON.stringify(clientQuestion));
                });
                if (callback) {
                    callback(data);
                } else {
                    return data;
                }
            }).error(function(data, status, headers) {
                console.log('error getting client questions' + status);

                var clientQuestions = [];

                for (var key in localStorage) {
                    if (key.indexOf('ClientQuestion') > -1) {
                        clientQuestions.push(JSON.parse(localStorage.getItem(key)));
                    }
                }

                callback(clientQuestions);

            });
        };

        function getCompleteSetofQuestionsFromLocalStorage() {
            var completeSetOfQuestions = [];

            if ($window.localStorage.getItem('CompleteSetOfQuestions') != null) {
                completeSetOfQuestions = JSON.parse($window.localStorage.getItem('CompleteSetOfQuestions'));
            }
            return completeSetOfQuestions;
        }

        var _getCompleteSetOfQuestions = function (callback) {

            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "GET", url: config.apiUrl + 'completesetofquestions', withCredentials: true }).success(function(data) {
                    if (callback) {
                        callback(data);
                    } else {
                        return data;
                    }
                }).error(function(data, status, headers) {
                    console.log('error getting complete set of questions' + status);
                        var completeSetOfQuestions = getCompleteSetofQuestionsFromLocalStorage();
                        callback(completeSetOfQuestions);
                });
            }
            else{
                if (callback) {
                    var completeSetOfQuestions = getCompleteSetofQuestionsFromLocalStorage();
                    callback(completeSetOfQuestions);
                }
            }
        };
    
        var _getQuestionsByClientAccountNumber = function (clientAccountNumber, callback)
        {
            var client = null;

            var questionKey = "clientquestions:" + clientAccountNumber;

            if (localStorage.getItem(questionKey) != undefined) 
            {
                client = JSON.parse(localStorage.getItem(questionKey));
                if (callback) 
                {
                    callback(client);
                }
            }
            else {
                _getClientQuestions(function(clients) {
                    var filteredClients = $filter('filter')(clients, { "ClientAccountNumber": clientAccountNumber });

                    if (filteredClients.length > 0) {
                        client = filteredClients[0];
                    }

                    if (callback) {
                        callback(client);
                    }

                });

            }
        };

        var getQuestionsByQuestionsArrayId = function (questionIdsArray) {

            //assume that complete set of questions have been stored locally
            questionsArray = getCompleteSetofQuestionsFromLocalStorage();

            if (questionIdsArray == null)
                return null;

            var questions = [];

            $.each(questionIdsArray, function (index, questionIdsArrayItem) {
                // get relevant questions with lower order no 
                var results = $filter('filter')(questionsArray, function (item) {
                    if (angular.isDefined(questionIdsArrayItem.Id)) {
                        return item.Id == questionIdsArrayItem.Id;
                    } else {
                        return item.Id == questionIdsArrayItem;
                    }
                });

                if (results != null && results.length > 0) {
                    questions.push(results[0]);
                }
            });

            return questions;
        };
        
        return {
            get: _getClientQuestions,
            getCompleteSetOfQuestions: _getCompleteSetOfQuestions,
            getByClientAccountNumber: _getQuestionsByClientAccountNumber,
            getQuestionsByQuestionsArrayId: getQuestionsByQuestionsArrayId
        };

    });