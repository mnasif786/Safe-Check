var AddBespokeQuestionController = function ($scope, $modalInstance, category, orderNumber, clientId) {
    var questionId = guid();

    $scope.newQuestion = {
        Question: {
            Id: questionId,
            Text: "",
            OrderNumber:orderNumber,
            PossibleResponses: [
                {
                    "Id": guid(),
                    "Title": "Acceptable",
                    "SupportingEvidence": "",
                    "ActionRequired": null,
                    "ResponseType": "Positive",
                    "GuidanceNotes": null,
                    "ReportLetterStatement": null
                }, 
                
                {
                "Id": guid(),
                "Title": "Improvement Required",
                "SupportingEvidence": "",
                "ActionRequired": null,
                "ResponseType": "Neutral",
                "GuidanceNotes": null,
                "ReportLetterStatement": null
                }, 
                
                {
                "Id": guid(),
                "Title": "Unacceptable",
                "SupportingEvidence": "",
                "ActionRequired": null,
                "ResponseType": "Negative",
                "GuidanceNotes": null,
                "ReportLetterStatement": null
                }],
            CategoryId: category.Id,
            Mandatory: false,
            SpecificToClientId: clientId,
            Category: category,
            CustomQuestion: true
        },
        Answer: {
            Id: null,
            SelectedResponseId: null,
            Comment: "",
            QuestionId: questionId
        }
    };

    $scope.ok = function () {
        $modalInstance.close($scope.newQuestion);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

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