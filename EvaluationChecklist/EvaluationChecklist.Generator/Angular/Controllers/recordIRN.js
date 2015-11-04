var RecordIRNController = function ($scope, $modal, $modalInstance, ClientEmployeeService, immediate, ChecklistService, ImpressionTypeService) {
    console.log('RecordIRNController start');
    var isCreate = (immediate == null);
    if (isCreate) {
        var recordIRNId = guid();
        $scope.newrecordIRN = {
            Id: recordIRNId,
            Reference: "",
            Title: "",
            SignificantHazard: "",
            RecommendedImmediate: ""
        };

        $scope.ok = function () {

            $scope.Checklist.ImmediateRiskNotifications.push($scope.newrecordIRN);

            ImpressionTypeService.getIRNImpressionType(function (impressionType) {
                if ($scope.ImpressionTypes != undefined) {
                    for (var i = 0; i < $scope.ImpressionTypes.length; i++) {
                        if ($scope.ImpressionTypes[i].Id == impressionType.Id) {
                            $scope.Checklist.SiteVisit.SelectedImpressionType = $scope.ImpressionTypes[i];
                        }
                    }
                }
            });


            ChecklistService.saveToLocalStorage($scope.Checklist);
            $modalInstance.close('put something here');
            $modal.open({
                templateUrl: 'angular/partials/confirmCreateRecordIRN.htm',
                controller: ConfirmCreateRecordIRNController,
                resolve: {
                    something: 'what'
                }
            });
        };

        $scope.cancel = function () {

            $modalInstance.dismiss('cancel');
        };
    } else {
        var reference = immediate.Reference;
        var title = immediate.Title;
        var signifiacantHazard = immediate.SignificantHazard;
        var recommendedAction = immediate.RecommendedImmediate;

        // reference in scope for binding
        $scope.immediate = immediate;

        $scope.newrecordIRN = {
            Id: immediate.Id,
            Reference: reference,
            Title: title,
            SignificantHazard: signifiacantHazard,
            RecommendedImmediate: recommendedAction
        };

        $scope.ok = function () {
            $scope.immediate.Id = $scope.newrecordIRN.Id;
            $scope.immediate.Reference = $scope.newrecordIRN.Reference;
            $scope.immediate.Title = $scope.newrecordIRN.Title;
            $scope.immediate.SignificantHazard = $scope.newrecordIRN.SignificantHazard;
            $scope.immediate.RecommendedImmediate = $scope.newrecordIRN.RecommendedImmediate;

            $modalInstance.close($scope.newrecordIRN);

        };

        $scope.cancel = function () {
            // restore values
            $scope.immediate.Reference = reference;
            $scope.immediate.Title = title;
            $scope.immediate.SignificantHazard = signifiacantHazard;
            $scope.immediate.RecommendedImmediate = recommendedAction;

            $modalInstance.dismiss('cancel');
        };

    }



    //todo: put this in a library. How safe is this?
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
};