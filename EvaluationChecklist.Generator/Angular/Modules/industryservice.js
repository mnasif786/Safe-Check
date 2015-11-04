angular.module('industryService', ['configService']).
    factory('IndustryService', function ($http, $q, $rootScope, $filter, ConfigService, $window) {
        var config = ConfigService.getConfig();

        // get the questions from localstorage based on key
        var _getIndustry = function (industryName, callback) {
            var industry = null;

            var questionKey = "Industry:" + industryName;

            if ($window.localStorage.getItem(questionKey) != undefined) {
                industry = JSON.parse($window.localStorage.getItem(questionKey));
                if (callback) {
                    callback(industry);
                }
            }
            else {
                _getIndustries(function (industries) {
                    //select industry from list
                    var filteredIndustry = $filter('filter')(industries, { "Title": industryName });

                    if (filteredIndustry.length > 0) {
                        industry = filteredIndustry[0];
                    }

                    if (callback) {
                        callback(industry);
                    }

                });
            }
            return industry;

        };

        var _getIndustryById = function (industryId, callback) {
            var industry = null;

            for (var key in localStorage) {
                if (key.indexOf('Industry') > -1) {
                    var industryData = JSON.parse($window.localStorage.getItem(key));

                    if (industryData.Id == industryId) {
                        if (callback) {
                            callback(industryData);
                        }

                        industry = industryData;
                    }
                }
            }

            if (industry == null) {
                _getIndustries(function (industries) {
                    //select industry from list
                    var filteredIndustry = $filter('filter')(industries, { "Id": industryId });

                    if (filteredIndustry.length > 0) {
                        industry = filteredIndustry[0];
                    }

                    if (callback) {
                        callback(industry);
                    }

                });

            }
            return industry;
        };

        var _getIndustries = function (callback) {

            if ($rootScope.isOnlineAndWorkingOnline($window)) {
                $http({ method: "GET", url: config.apiUrl + 'industries', withCredentials: true }).success(function (data) {
                    $.each(data, function (idx, industry) {
                        if (!industry.Draft) {
                            $window.localStorage.setItem('Industry:' + industry.Title, JSON.stringify(industry));
                        } else {
                            $window.localStorage.removeItem('Industry:' + industry.Title); //remove any draft templates that have been saved to local storage
                        }
                    });

                    callback(data);
                }).error(function (data, status, headers) {
                    console.log('error getting industries' + status);
                });
            } else {
                var industries = [];

                for (var key in $window.localStorage) {
                    if (key.indexOf('Industry') > -1) {
                        industries.push(JSON.parse($window.localStorage.getItem(key)));
                    }
                }
                if (industries.length) {
                    callback(industries);
                }
            }
        };

        // get the questions from localstorage based on key
        var _getIndustriesForQuestion = function (questionId, callback) {
            $http({ method: "GET", url: config.apiUrl + 'industries/' + questionId, withCredentials: true })
                .success(function (data) {
                    if (callback) {
                        callback(data);
                    }
                    else {
                        return data;
                    }
                })
                .error(function (data, status, headers) {
                    console.log('error getting industries for question' + status);

                    if (industries.length) {
                        callback(industries);
                    }
                });
        };

        var _updateIndustryQuestions = function (questionId, industries, industryMembers) {

            var industryQuestionModel = {
                QuestionId: questionId,
                IndustryIds: []
            };

            //            industryQuestionModel.QuestionId = questionId;
            //            industryQuestionModel.IndustryIds = [];

            $.each(industries, function (idx, questionIndustry) {
                if (industryMembers[questionIndustry.Id] == true) {
                    industryQuestionModel.IndustryIds.push(questionIndustry.Id);
                }
            });


            $http({ method: "POST", url: config.apiUrl + 'industryquestions', data: industryQuestionModel, withCredentials: true }).
                success(function () {
                    console.log('Industry Questions saved to server');
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                });           
        };
        
        var _cloneTemplate = function(id, templateType, name){
            var deferred = $q.defer();
            var request = {};
            request.Id = id;
            request.TemplateType = templateType;
            request.Name = name;

            $http({ method: "POST", url: config.apiUrl + 'industry/clone', data: request, withCredentials: true }).
                success(function () {
                    console.log('Template clone request sent to server');
                    deferred.resolve({ success: true, msg: 'Template successfully cloned.' });
                }).
                error(function (data, status, headers, config) {
                    console.log('unable to contact server');
                    deferred.resolve({ success: false, msg: 'An error occurred trying to complete your request.' });
                });

            return deferred.promise;

        };
        return {
            get: _getIndustries,
            getIndustry: _getIndustry,
            getIndustryById: _getIndustryById,
            getIndustriesForQuestion: _getIndustriesForQuestion,
            updateIndustryQuestions: _updateIndustryQuestions,
	        cloneTemplate: _cloneTemplate
        };


    });