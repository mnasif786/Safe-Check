angular.module('templateService', [])
    .service('TemplateService', function () {
        var _templates = {
            checklists: 'angular/partials/_checklists.htm',
            category: 'angular/partials/_category.htm'
        };
        function _getTemplates() {
            return _templates;
        }
        return {
            getTemplates:_getTemplates
        };
    });