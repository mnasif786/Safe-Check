var OtherEmailController = function ($rootScope, $scope, $modalInstance, otherEmail) {

    var originalOtherEmailAddress = otherEmail.EmailAddress;
    $scope.otherEmail = otherEmail;
    
    $scope.ok = function () {
        if ($scope.validateResponse()) {
            $modalInstance.close($scope.otherEmail);
        } else {
            return;
        }
    };
    
    $scope.cancel = function () {
        $scope.otherEmail.EmailAddress = originalOtherEmailAddress;
        $modalInstance.dismiss('cancel');
    };
    
    $scope.validateResponse = function () {
        $scope.validationMessages = [];
        
        if (!angular.isDefined($scope.otherEmail.EmailAddress) || isNullOrEmptyString($scope.otherEmail.EmailAddress)) {
            $scope.validationMessages.push({ type: 'error', msg: 'Please provide an email address.' });
            return false;
        }
        
        if (!$scope.validateOtherEmailAddresses($scope.otherEmail.EmailAddress)) {
            $scope.validationMessages.push({ type: 'error', msg: 'Please enter a valid email address.' });
            return  false;
        }

        if (!angular.isDefined($scope.otherEmail.Name) || isNullOrEmptyString($scope.otherEmail.Name)) {
            $scope.validationMessages.push({ type: 'error', msg: 'Please provide a name.' });
            return false;
        }

        return true;
    };

    $scope.closeAlert = function (index) {
        $scope.validationMessages.splice(index, 1);
    };
};