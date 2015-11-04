var AssignQaAdvisorPopupController = function ($rootScope, $scope, $modalInstance, ChecklistService, checklistId, qaAdvisor) {

    console.log('AssignQaAdvisorPopupController start');

    $scope.qaAdvisor = qaAdvisor;

    $scope.assignChecklistReportToQaAdvisor = function () {

        $rootScope.blockUI();

        ChecklistService.assignChecklistToQaAdvisor(checklistId, qaAdvisor).then(function () {
            $rootScope.unblockUI();
        });

        console.log('Checklist assigned to QA Advisor' + qaAdvisor.Name);
        //$modalInstance.dismiss('assignedReportToQaAdvisor');
        $modalInstance.close(qaAdvisor);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};