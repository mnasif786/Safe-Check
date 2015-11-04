var ShowUnansweredQuestionsController = function ($scope, $modalInstance, $filter, listOfAnswerNoResponse, categories) {

    $scope.filterAnswerNoResponse = listOfAnswerNoResponse;
    $scope.categories = [];

    angular.forEach(categories, function (category, key) {
        var questions = $filter('filter')(listOfAnswerNoResponse, function (questionAnswer) {
            return questionAnswer.Question.CategoryId == category.Id;
        });

        if (questions.length > 0) {
            this.push(category);
        }

    }, $scope.categories
    );


    $scope.ok = function () {
        $modalInstance.close('put something here');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    // $scope.currentCategory = listOfAnswerNoResponse[0].CategoryTitle;
    $scope.CreateHeader = function (category) {
        return true;
    };

    $scope.getFilterReasonText = function (answer) {
        var result = "";

        if (answer.SelectedResponseId == null || answer.Response == null) {
            result += "Unanswered ";
        }
        else if (answer.Response.Title == "Unacceptable" || answer.Response.Title == "Improvement Required") 
        {
            if (answer.Timescale == null) 
            {
                result += "Agreed Timescale";

                if (answer.AssignedTo == null) {
                    result += ", ";
                }
            }

            if (answer.AssignedTo == null) {
                result += "Assigned To";
            }
        }

        return result;
    };
}