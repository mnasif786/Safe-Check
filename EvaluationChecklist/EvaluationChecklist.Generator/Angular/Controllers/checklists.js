function ChecklistsController($scope, $location, $timeout, ChecklistService, TemplateService) {
    console.log('ChecklistsController start');
    $scope.templates = TemplateService.getTemplates();
    
    var createNewChecklist = function(id, companyName, requiresSyncing, version) {
        return {
            "Id": id,
            "CompanyName": companyName,
            "UnsubmittedChangesExist": requiresSyncing,
            "Version": version
        };
    };

    $scope.checklistCount = function() {
        return $scope.checklists.length;
    };

    //$scope.checklists = ChecklistService.query();

    ChecklistService.query(function (data) {
        $scope.checklists = data;
    });


    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    ;

    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }


    $scope.startNewChecklist = function() {
        $location.path("/clientsearch");
    };
    
}
