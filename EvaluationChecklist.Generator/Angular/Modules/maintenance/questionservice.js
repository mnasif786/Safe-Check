angular.module('questionService', ['configService']).
    factory('QuestionService', function ($rootScope, $http, ConfigService, $q, $window, $filter) {
        var config = ConfigService.getConfig();

        var _getHeadingsFromLocalStorage = function(){
            var headings = [];
            if ($window.localStorage.getItem('ReportLetterHeadings') != null) {
                headings = JSON.parse($window.localStorage.getItem('ReportLetterHeadings'));
            }
            return headings;
        };

        var _getQuestion = function (id, callback) {
            $http({ method: "GET", url: config.apiUrl + 'question/' + id, withCredentials: true }).success(function (data) {
                callback(data);
            });
        };

        var _saveQuestion = function(question) {
            var deferred = $q.defer();
            $http({ method: "POST", url: config.apiUrl + 'question/' + question.Id, data: question, withCredentials: true })
                .success(function() {
                    deferred.resolve({ success: true, msg: 'Question saved to the database.' });
                })
                .error(function(data, status, headers) {
                    deferred.resolve({ success: false, msg: 'Unable to save question to the database.' });
                });
            return deferred.promise;
        };

        var _getHeadings = function () {
            var deferred = $q.defer();

            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "GET", url: config.apiUrl + 'headings', withCredentials: true })
                .success(function (response) {
                    response = $filter('orderBy')(response, 'Sequence');
                    $window.localStorage.setItem('ReportLetterHeadings', JSON.stringify(response));
                    deferred.resolve({ success: true, msg: 'Report letter categories successfully updated', data: response});
                })
                .error(function(response, status, headers) {
                    var headings = _getHeadingsFromLocalStorage();
                    deferred.resolve({ success: true, msg: 'Report letter categories successfully updated', data: headings});
                });
            }
            else{
                var headings = _getHeadingsFromLocalStorage();
                deferred.resolve({ success: true, msg: 'Report letter categories successfully updated', data: headings});
            }
            return deferred.promise;
        };

        var _getNextQuestionOrderNumber = function(callback) {
            $http({ method: "GET", url: config.apiUrl + 'question/getQuestionNextOrderNumber', withCredentials: true }).success(function (data) {
                callback(data);
            });
        };

        var _saveQuestionOrder = function (questionsOrder) {
            var deferred = $q.defer();

            var request = questionsOrder;

            $http({ method: "POST", url: config.apiUrl + 'question/questionorder', data: request, withCredentials: true })
                .success(function () {
                    deferred.resolve({ success: true, msg: 'Question order saved to the database.' });
                })
                .error(function (data, status, headers) {
                    deferred.resolve({ success: false, msg: 'Unable to save question order to the database.' });
                });
            return deferred.promise;
        };
        
        return {
            get: _getQuestion,
            saveQuestion: _saveQuestion,
            getHeadings: _getHeadings,
            getHeadingsFromLocalStorage: _getHeadingsFromLocalStorage(),
            getNextQuestionOrderNumber: _getNextQuestionOrderNumber,
            saveQuestionOrder: _saveQuestionOrder
        };
    }
)