var ConfirmDialogController = function ($scope, $modalInstance, question, options) {

    $scope.question = question;
    $scope.options = options;

    $scope.ok = function () {
        $modalInstance.close($scope.question);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};

var ConfirmDeleteConsultantDialogController = function ($scope, $modalInstance, consultant, options) {

    $scope.consultant = consultant;
    $scope.options = options;

    $scope.ok = function () {
        $modalInstance.close($scope.consultant);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};

var informationDialogController = function ($scope, $modalInstance, options) {

    $scope.options = options;


    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};

var yesNoDialogController = function ($scope, $modalInstance, options) {
    $scope.options = options;
    $scope.options.ok = "Yes";
    $scope.options.cancel = "No";

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};