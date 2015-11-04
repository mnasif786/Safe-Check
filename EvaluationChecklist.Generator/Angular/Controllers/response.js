var ResponseController = function ($scope, $modalInstance, $timeout, ClientEmployeeService, questionAnswer, nonEmployees, clientId, areQACommentsEnabled) {

    $scope.nonEmployees = nonEmployees;
    $scope.validationMessages = [];
    $scope.questionAnswer = questionAnswer;

    $scope.qaSignedOff = ($scope.questionAnswer.Answer.QaSignedOffBy != undefined && $scope.questionAnswer.Answer.QaSignedOffBy != null);

    $scope.userHasQaRole = ($scope.user.role == 'QA');

    $scope.signOff = function () {
        if ($scope.questionAnswer.Answer.QaSignedOffBy == null || $scope.questionAnswer.Answer.QaSignedOffBy == undefined) {
            $scope.questionAnswer.Answer.QaSignedOffBy = $scope.user.fullname();
            $scope.questionAnswer.Answer.QaSignedOffDate = new Date();
        } else {
            $scope.questionAnswer.Answer.QaSignedOffBy = null;
            $scope.questionAnswer.Answer.QaSignedOffDate = null;
        }
    };

    // add new timescale options on top of old ones, need to display completed checklist timescales
    var timescales = [
        { Id: "0", Name: "None", Order: 5},
        { Id: "1", Name: "One Month", Order: 4},
        { Id: "2", Name: "Three Months", Order: 3},
    //{ Id: "3", Name: "Six Months" },
        { Id: "4", Name: "Urgent Action Required", Order: 1 },
        { Id: "5", Name: "Six Weeks", Order: 2 }
    ];

    var unacceptableTimeScales = new Array("4", "5");
    var improvementRequiredTimeScales = new Array("5","2");
  
    $scope.Timescales = sortByKey(timescales, 'Order');

    //var clientid = $scope.ClientId;
    ClientEmployeeService.get(clientId, function (data) {
        $scope.ClientEmployees = [];
        if (data.length >= 0) {
            data.splice(data.length, 0, {
                Id: emptyGuid(),
                FullName: "-- Not Listed --",
                NonEmployeeName: IsNullOrUndefined($scope.questionAnswer.Answer.AssignedTo) ? "" : $scope.questionAnswer.Answer.AssignedTo.NonEmployeeName
            });

            $scope.ClientEmployees = data;
        }

        // NB: This is a fix for known issue with Angular select binding
        if ($scope.questionAnswer.Answer.AssignedTo != undefined && $scope.ClientEmployees != undefined) {
            for (var i = 0; i < $scope.ClientEmployees.length; i++) {
                if ($scope.ClientEmployees[i].Id == $scope.questionAnswer.Answer.AssignedTo.Id) {
                    $scope.questionAnswer.Answer.AssignedTo = $scope.ClientEmployees[i];
                    break;
                }
            }
        }
    });

    // NB: This is a fix for known issue with Angular select binding
    if ($scope.questionAnswer.Answer.Timescale != undefined) {
        for (var i = 0; i < $scope.Timescales.length; i++) {
            if ($scope.Timescales[i].Id == $scope.questionAnswer.Answer.Timescale.Id) {
                $scope.questionAnswer.Answer.Timescale = $scope.Timescales[i];
                break;
            }
        }
    }

    $scope.ok = function () {

        if ($scope.questionAnswer.Answer.SupportingDocumentationStatus == "" || $scope.questionAnswer.Answer.SupportingDocumentationStatus == null) {
            $scope.questionAnswer.Answer.SupportingDocumentationDate = null;
        }

        if ($scope.validateResponse()) {
            $modalInstance.close($scope.questionAnswer);
        } else {
            return;
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.isEmployeeNotListed = function () {
        var result = false;

        if ($scope.questionAnswer.Answer.AssignedTo != undefined
            && $scope.questionAnswer.Answer.AssignedTo.Id == emptyGuid()) {
            result = true;
        }
        return result;
    };

    $scope.updateAreaOfNonCompliance = function (questionAnswer) {
        angular.forEach(questionAnswer.Question.PossibleResponses, function (val, key) {
            val.ReportLetterStatement = questionAnswer.Answer.ReportLetterStatement;
        });
    };

    $scope.showAreaOfNonCompliance = function (questionAnswer) {
        var result = false;

        angular.forEach(questionAnswer.Question.PossibleResponses, function (val, key) {
            if (val.Id == questionAnswer.Answer.SelectedResponseId &&
            (val.Title != "Acceptable" && val.Title != "Not Applicable")) {
                result = true;
            };
        });

        return result;
    };

    $scope.isQuestionTextEditable = function (questionAnswer) {
        return !questionAnswer.Question.Mandatory && questionAnswer.Question.CustomQuestion;
    };

    $scope.isSupportDocumentationDateVisible = function (questionAnswer) {
        var isSupportDocumentationDateVisible =     questionAnswer.Answer.Response.Title == 'Acceptable'
                                                &&  questionAnswer.Answer.SupportingDocumentationStatus != '' 
                                                &&  questionAnswer.Answer.SupportingDocumentationStatus == 'Verified';
        if (isSupportDocumentationDateVisible) {
            $scope.responsedetailsbody = 'response-details-body-no-scroll';
        } else {
            $scope.responsedetailsbody = 'response-details-body';
        }
        return isSupportDocumentationDateVisible;
    };

    $scope.areQACommentsEnabled = function () {
        return areQACommentsEnabled;
    };

    $scope.validateResponse = function () {
        $scope.validationMessages = [];
        var result = true;

        if (!$scope.userHasQaRole) {
            if ($scope.questionAnswer.Answer.Response.Title == "Unacceptable" || $scope.questionAnswer.Answer.Response.Title == "Improvement Required") {
                if ($scope.isEmployeeNotListed() && $scope.questionAnswer.Answer.AssignedTo.NonEmployeeName == '') {
                    $scope.validationMessages.push({ type: 'error', msg: 'Not listed employee name must be provided' });
                    result = false;
                }

//                if ($scope.questionAnswer.Answer.AssignedTo == null) {
//                    $scope.validationMessages.push({ type: 'error', msg: 'Assigned To must be selected' });
//                    result = false;
//                 }
//    
//                if (questionAnswer.Answer.Timescale == null) {
//                    $scope.validationMessages.push({ type: 'error', msg: 'Agreed Timescale must be selected ' });
//                    result = false;
//                }
            }
        }
        return result;
    };

    $scope.closeAlert = function (index) {
        $scope.validationMessages.splice(index, 1);
    };

    if ($scope.questionAnswer.Answer.Response.Title == 'Acceptable' && $scope.questionAnswer.Answer.SupportingDocumentationStatus == null) {
        $scope.questionAnswer.Answer.SupportingDocumentationStatus = '';
    }

    if (questionAnswer.Answer.SupportingDocumentationStatus == "Verified") {
        $scope.verifiedLabel = "Documentary Evidence Seen - Next Due Date";
    } else {
        $scope.verifiedLabel = "Documentary Evidence Seen";
    }

    $scope.verifiedChanged = function () {
        if ($scope.questionAnswer.Answer.SupportingDocumentationStatus == "Verified") {
            $scope.verifiedLabel = "Documentary Evidence Seen - Next Due Date";
        } else {
            $scope.questionAnswer.Answer.SupportingDocumentationDate = '';
            $scope.verifiedLabel = "Documentary Evidence Seen";
        }
    };

    $scope.isNegativeResponse = function (response) {
        var result = false;
        if (response.Title == 'Unacceptable' || response.Title == 'Improvement Required') {
            result = true;
        }
        else if (response.Title == 'Acceptable' || response.Title == 'Not Applicable') {
            result = false;
        }
        return result;
    };

    $scope.open = function () {
        $timeout(function () {
            $scope.opened = true;
        });
    };

    var getReposnseTimescales = function () {
        if (!angular.isDefined($scope.questionAnswer.Answer.Response) || !angular.isDefined($scope.questionAnswer.Answer.Response.Title))
            return new Array();

        if ($scope.questionAnswer.Answer.Response.Title == 'Unacceptable') {
            return unacceptableTimeScales;
        } else if ($scope.questionAnswer.Answer.Response.Title == 'Improvement Required') {
            return improvementRequiredTimeScales;
        } else {
            return new Array();
        }
    };

    $scope.displayTimeScaleInDropDown = function (timeScale) {
        var tempArray = getReposnseTimescales();

        if (angular.isDefined(questionAnswer.Answer.Timescale) && questionAnswer.Answer.Timescale != null) {
            return (tempArray.indexOf(timeScale.Id) >= 0 || timeScale.Id == questionAnswer.Answer.Timescale.Id);
        } else {
            return (tempArray.indexOf(timeScale.Id) >= 0);
        }
    };

}




