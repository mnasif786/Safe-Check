angular.module('checklistTemplateService', ['configService']).
    factory('ChecklistTemplateService', function ($rootScope, $http, $filter, ConfigService, $q, $window, ClientQuestionService) {
    var config = ConfigService.getConfig();

    var _getChecklistTemplates = function(callback) {
        if ($rootScope.isOnlineAndWorkingOnline($window)) {
            $http({ method: "GET", url: config.apiUrl + 'checklisttemplate', withCredentials: true }).success(function(data) {
                callback(data);
            }).error(function(data, status, headers) {
                console.log('error getting checklist templates questions' + status);
            });
        } else {
            var templates = [];

            for (var key in $window.localStorage) {
                if (key.indexOf('ChecklistTemplate') > -1) {
                    templates.push(JSON.parse($window.localStorage.getItem(key)));
                }
            }

            callback(templates);

        }
    };

    var _getChecklistTemplateByName = function(templateName, callback) {
        _getChecklistTemplates(function(data) {
            var templates = $filter('filter')(data, { "TemplateType": templateName });

            callback(templates);
        });
    };

    var _getBespokeTemplatesWithOnlyIds = function(callback) {
        $http({ method: "GET", url: config.apiUrl + 'checklisttemplate/GetWithQuestionIds', withCredentials: true }).success(function(data) {
            var templates = $filter('filter')(data, { "TemplateType": "Bespoke" });
            callback(templates);

        }).error(function(templates, status) {
            console.log('error getting checklist templates questions Ids' + status);

        });
    };

    var _getTemplatesWithOnlyIds = function(callback) {
        if ($rootScope.isOnlineAndWorkingOnline($window)) {
            $http({ method: "GET", url: config.apiUrl + 'checklisttemplate/getwithquestionids', withCredentials: true }).success(function(data) {

                callback(data);
            }).error(function(templates, status) {
                console.log('error getting checklist templates questions Ids' + status);
            });
        } else {
            var templates = [];

            for (var key in $window.localStorage) {
                if (key.indexOf('ChecklistTemplate') > -1) {
                    templates.push(JSON.parse($window.localStorage.getItem(key)));
                }
            }

            callback(templates);
        }
    };

    var _cloneTemplate = function(id, templateType, name) {
        var deferred = $q.defer();
        var request = {};
        request.Id = id;
        request.TemplateType = templateType;
        request.Name = name;

        $http({ method: "POST", url: config.apiUrl + 'template/clone', data: request, withCredentials: true }).
            success(function() {
                console.log('Template clone request sent to server');
                deferred.resolve({ success: true, msg: 'Template successfully cloned.' });
            }).
            error(function(data, status, headers, config) {
                console.log('unable to contact server');
                if (status == 403) {
                    deferred.resolve({ success: false, msg: 'The spcified name is not not allowed. Another template may already exist with this name.' });
                } else {
                    deferred.resolve({ success: false, msg: 'An error occurred trying to complete your request.' });
                }
            });

        return deferred.promise;

    };

    var _renameTemplate = function(id, name) {
        var deferred = $q.defer();
        var request = {};
        request.Id = id;
        request.Name = name;

        $http({ method: "POST", url: config.apiUrl + 'template/rename', data: request, withCredentials: true }).
            success(function() {
                console.log('Template rename request sent to server');
                deferred.resolve({ success: true, msg: 'Template successfully renamed.' });
            }).
            error(function(data, status, headers, config) {
                console.log('unable to contact server');
                if (status == 403) {
                    deferred.resolve({ success: false, msg: 'The spcified name is not not allowed. Another template may already exist with this name.' });
                } else {
                    deferred.resolve({ success: false, msg: 'An error occurred trying to complete your request.' });
                }
            });

        return deferred.promise;

    };

    var _updateTemplate = function(id, template) {
        var deferred = $q.defer();

        var templateViewModel =
        {
            Id: template.Id,
            Title: template.Title,
            Draft: template.Draft
            /* Questions { get; set; }*/
        };

        $http({ method: "POST", url: config.apiUrl + 'industries', data: templateViewModel, withCredentials: true }).
            success(function() {
                console.log('Checklist Template saved to server');
                deferred.resolve({ success: true, msg: 'Template successfully updated.' });
            }).
            error(function(data, status, headers, config) {
                deferred.resolve({ success: false, msg: 'An error occurred trying to complete your request.' });
                console.log('unable to contact server');
            });

        return deferred.promise;
    };

    var _updateTemplateQuestion = function(templateId, question, exclude) {

        var deferred = $q.defer();

        var request = {};
        request.TemplateId = templateId;
        request.QuestionId = question.Id;
        request.Exclude = exclude;

        $http({ method: "POST", url: config.apiUrl + 'template/updatequestion', data: request, withCredentials: true }).
            success(function() {
                console.log('DeleteTemplate request sent to server');
                deferred.resolve({ success: true, msg: 'Template successfully deleted.' });
            }).
            error(function(data, status, headers, config) {
                console.log('unable to contact server');
                deferred.resolve({ success: false, msg: 'An error occurred trying to complete your request.' });
            });

        return deferred.promise;
    };

    var _deleteTemplate = function(templateId) {

        var deferred = $q.defer();

        $http({ method: "POST", url: config.apiUrl + 'template/deletetemplate/' + templateId, withCredentials: true }).
            success(function() {
                console.log('updateTemplateQuestion request sent to server');
                deferred.resolve({ success: true, msg: 'Template successfully deleted.' });
            }).
            error(function(data, status, headers, config) {
                console.log('unable to contact server');
                deferred.resolve({ success: false, msg: 'An error occurred trying to complete your request.' });
            });

        return deferred.promise;
    };

    var _getById = function(id, callback) {
        if ($rootScope.isOnlineAndWorkingOnline($window)) {
            $http({ method: "GET", url: config.apiUrl + 'checklisttemplate/' + id, withCredentials: true }).success(function(data) {
                callback(data);
            });
        } else {

            for (var key in $window.localStorage) {
                if (key.indexOf('ChecklistTemplate') > -1) {
                    var templateData = JSON.parse($window.localStorage.getItem(key));

                    if (templateData.Id == id) {

                        var inflatedQuestions = ClientQuestionService.getQuestionsByQuestionsArrayId(templateData.Questions);
                        templateData.Questions = inflatedQuestions;

                        callback(templateData);
                    }
                }
            }

        }
    };

    var _saveChecklistTemplateToLocalStorage = function(template) {
        var deflatedQuestionIds = [];
        angular.forEach(template.Questions, function(question, index) {
            deflatedQuestionIds.push(question.Id);
        });

        template.Questions = deflatedQuestionIds;

        $window.localStorage.setItem('ChecklistTemplate.' + template.Title, JSON.stringify(template));
    };

    var _getTemplateName = function(id, callback) {
        if( $rootScope.isOnlineAndWorkingOnline($window)) {
            $http({ method: "GET", url: config.apiUrl + 'template/' + id + '/name', withCredentials: true }).success(function(data) {
                callback(JSON.parse(data));
            });
        } else {
            _getById(id, function (checklistTemplate) {
                callback(checklistTemplate.Name);
            });
}
    };

    return {
        get: _getById,
        getAll: _getChecklistTemplates,
        getIndustryTemplates: function(callback) {
            _getChecklistTemplateByName("Industry", callback);
        },
        getBespokeTemplates: function(callback) {
            _getChecklistTemplateByName("Bespoke", callback);
        },
        cloneTemplate: _cloneTemplate,
        renameTemplate: _renameTemplate,
        updateTemplate: _updateTemplate,
        updateTemplateQuestion: _updateTemplateQuestion,
        deleteTemplate: _deleteTemplate,
        getBespokeTemplateWithQuestionIds: _getBespokeTemplatesWithOnlyIds,
        getTemplatesWithOnlyQuestionIds: _getTemplatesWithOnlyIds,
        saveChecklistTemplateToLocalStorage: _saveChecklistTemplateToLocalStorage,
        getTemplateName: _getTemplateName
    };

});

