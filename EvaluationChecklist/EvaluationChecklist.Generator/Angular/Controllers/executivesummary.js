function ExecutiveSummaryController($scope, $routeParams, ChecklistService, ExecutiveSummaryService, ConfigService, $modal, $window, $filter) {
    console.log("ExecutiveSummaryController start ");

    $scope.tinymceOptions = {
        plugins: "pagebreak, textcolor, paste, print,jqueryspellchecker", // this plugin removes cleans up any text copied from word
        menu: {}, //remove menu bar
        browser_spellcheck: true, //enables browser spell checking
        toolbar: "forecolor backcolor | undo redo | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | pagebreak | jqueryspellchecker",
        statusbar: false, //removes status bar
        script_url: 'js/lib/tinymce/tiny_mce.js',
        readonly: false,
        theme: "modern",
        content_css: "content/jquery.spellchecker.css",
        convert_urls: false,
        pagebreak_separator: "<span style='page-break-after:always '></span>",
        paste_as_text: true // paste as plain text
    };

    $scope.complianceReviewItems = [];

   var getResponse = function (questionAnswer) {
        if (angular.isDefined(questionAnswer.Answer) && questionAnswer.Answer != null && questionAnswer.Answer.SelectedResponseId != null) {
            var answerResponses = $filter('filter')(questionAnswer.Question.PossibleResponses, { "Id": questionAnswer.Answer.SelectedResponseId });

            if (answerResponses.length > 0) {
                return answerResponses[0];
            } 
        }

        return questionAnswer.Answer.Response;
   }

    var loadChecklist = function() {
        var checklistData = ChecklistService.retrieveFromLocalStorage($routeParams.Id);

        if (checklistData == null) {
            ChecklistService.get($routeParams.Id, function(data) {
                getChecklistCallback(data);
            });
        } else {
            getChecklistCallback(checklistData);
        }
    };

   var getChecklistCallback = function (data) {
       $.each(data.Questions, function (idx, questionAnswer) {
           if (angular.isDefined(questionAnswer.Answer) && !angular.isDefined(questionAnswer.Answer.Response)) {
               questionAnswer.Answer.Response = getResponse(questionAnswer);
           }
       });

       $scope.Checklist = data;

       if (angular.isDefined($scope.user)) {
           $scope.Checklist.PostedBy = $scope.user.fullname();
           $scope.Checklist.PostedByEmailAddress = $scope.user.email;
       }

       if (IsNullOrUndefined($scope.Checklist.ShowActionPlan))
           $scope.Checklist.ShowActionPlan = true;

       if (IsNullOrUndefined($scope.Checklist.ShowComplianceReview))
           $scope.Checklist.ShowComplianceReview = true;
           
       $scope.IsEditLetter = true;
       if ($scope.Checklist.CoveringLetterContent == null || $scope.Checklist.CoveringLetterContent == "") {
           if (angular.isDefined($routeParams.templateId)) {
               ExecutiveSummaryService.generateLetter($routeParams.templateId, $scope.Checklist).then(function (response) {
                   $scope.Checklist.CoveringLetterContent = response.content;
                   $scope.Checklist.ClientLogoFilename = response.clientLogoFilename;
                   $scope.Checklist.IncludeGuidanceNotes = response.IncludeGuidanceNotes;
               });
           }
       }
       else {
           if (localStorage["viewLetterMode." + $routeParams.Id] == 1) {
               $scope.tinymceOptions.readonly = true;
               $scope.IsEditLetter = false;
           }
           else {
               $scope.IsEditLetter = true;
           }
       }
       
       _removeViewLetterModeItemsFromLocalStorage();

       $scope.complianceReviewItems = _getQuestionAnswersByResponeType("Positive");
       
   };

    //Remove all values of viewLetterMode from local storage. We dont need them after the letter editor screen has loaded. ALP
   var _removeViewLetterModeItemsFromLocalStorage = function () {
       for (var key in localStorage) {
           if (key.indexOf('viewLetterMode.') > -1) {
               $window.localStorage.removeItem(key);
           }
       }
   };

    var saveChangeNotification = function () {
        console.log('saveChangeNotification called');

        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'angular/partials/savechangenotification.htm',
            controller: SaveChangeNotificationController,
            resolve: {
                something: 'what'
            }
        });

        modalInstance.result.then(function () 
            {
            //OK clicked.
            }, 
            function () {
            //Cancel clicked.
        });
    };

    $scope.save = function () {
        var parentChecklistWindow = $window.opener;

        if (parentChecklistWindow == null || parentChecklistWindow.location.href.indexOf($scope.Checklist.Id) == -1) {
            //dont save if the parent window belongs to another checklist
            alert("Unable to save changes. If you don't want to lose your changes, load the report, open the executive summary letter via the edit or generate button and then copy your changes into the new editor window.");
            return;
        }

        var coveringLetterContentParentElement = $('#coveringLetterContent', parentChecklistWindow.document);
        coveringLetterContentParentElement.val($scope.Checklist.CoveringLetterContent);

        var btn = $('#genLetterButton', parentChecklistWindow.document);
        btn.trigger("click");

        saveChangeNotification();
    };
    

    // changed their mind again so have two different sets of priorities, left old ones in to generate existing reports correctly
    $scope.actionPlanItemOrder = function (questionAnswer) {
        var priority;

        if (questionAnswer.Answer.Response.Title != null && questionAnswer.Answer.Timescale != null) {
            switch (questionAnswer.Answer.Timescale.Name) {
                case "Urgent Action Required":
                    priority = 1;
                    break;
                case "Six Weeks":
                    if (questionAnswer.Answer.Response.Title == "Unacceptable") 
                        priority = 2;
                    else {
                        priority = 3;
                    }
                    break;
                case "One Month":
                    priority = 4;
                    break;
                case "Three Months":
                    priority = 5;
                    break;             
               case "Six Months":
                    priority = 6;
                    break;
                case "None":
                    priority = 7;
                    break;
                }
        }
       else {
           priority = 8;
       }

       return priority;
    };
    
    $scope.doClose = function (e) {
        $window.localStorage.removeItem("viewLetterMode." + $routeParams.Id);
        $window.close();        
    };

    $scope.hasActionRequired = function (questionAnswer) {
        return (questionAnswer.Answer.Response != undefined
            && (questionAnswer.Answer.Response.Title == 'Unacceptable' || questionAnswer.Answer.Response.Title == 'Improvement Required'));
    };

    $scope.isNotApplicable = function(questionAnswer) {
        if (!angular.isDefined(questionAnswer.Answer.Response)) {
            return false;
        }

        return (angular.isDefined(questionAnswer.Answer.Response)
            && questionAnswer.Answer.Response.Title == 'Not Applicable');
    };

    $scope.not = function (func) {
        return function (item) {
            return !func(item);
        }
    };

    $scope.PDFDownloadUrl = function () {
        return ConfigService.getConfig().apiUrl + "reports/actionplan/pdf";

    };

    $scope.ClientPreviewPDFDownloadUrl = function () {
        return ConfigService.getConfig().apiUrl + "reports/clientpreview/pdf";

    };

    
    $scope.AllocatedToName = function (questionAnswer) {
        if (questionAnswer.Answer.AssignedTo == null) {
            return "";
        }
        if (questionAnswer.Answer.AssignedTo.FullName == "-- Not Listed --") {
            return questionAnswer.Answer.AssignedTo.NonEmployeeName;
        } else {
            return questionAnswer.Answer.AssignedTo.FullName;
        }
    };

    $scope.countOfResponseByType = function (responseType) {
        if (!angular.isDefined($scope.Checklist)) {
            return 0;
        }

        var questionAnswers = _getQuestionAnswersByResponeType(responseType);

        return questionAnswers.length;
    };

    var _getQuestionAnswersByResponeType = function(responseType) {
        var questionAnswers = $filter('filter')($scope.Checklist.Questions, function(item) {
            if (!angular.isDefined(item.Answer.Response)) {
                return false;
            }
            return item.Answer.Response.ResponseType == responseType;
        });

        return questionAnswers;
    };

    $scope.getAdditionalPersonsSeenString = function() {
        var delimiter = ", ";
        var result = "";
        if (angular.isDefined($scope.Checklist) && angular.isDefined($scope.Checklist.PersonsSeen)) {
            angular.forEach($scope.Checklist.PersonsSeen, function (personSeen, key) {
                if (key > 0) {
                    result += delimiter;
                }
                result += personSeen.FullName;
            });
        }

        return result;
    };

    $scope.showGuidanceNotes = function () {
        if (angular.isDefined($scope.Checklist) && angular.isDefined($scope.Checklist.IncludeGuidanceNotes)) {
            if ($scope.Checklist.IncludeGuidanceNotes == false)
                return false;
        }
        return true;
    };

    loadChecklist();

}

var executiveSummaryHelper = (function () {
    var letterDatePlaceHolderHtml = "<p data-letter-date=\"\"><span style=\"color: #d7d7d7;\">[letter date: auto generated]</span></p>";
    var blackHexValue = "#000000";
    var blackRGBValue = "rgb(0, 0, 0)";
    var whiteHexValue = "#FFFFFF";
    var whiteRGBValue = "rgb(255, 255, 255)";

    var isColourBlack = function(colour) {
        return (colour == blackHexValue || colour == blackRGBValue);
    };

    var isColourWhite = function(colour) {
        return (colour == whiteHexValue || colour == whiteRGBValue);
    };


    return {
        doesExecutiveLetterContainColouredText: function (letterContentHTML) {
            if (letterContentHTML == null || letterContentHTML == "") {
                return false;
            }
            var returnValue = false;
            //checking text colour
            var colourStyles = letterContentHTML
                .replace(letterDatePlaceHolderHtml, "")
                .match(/[^-]color: #......|[^-]color: rgb\(.{7,13}\)/g);
            
            $(colourStyles).each(function () {
                var colour = this.valueOf().split(":")[1].trim();
                if (!isColourBlack(colour)) {
                    returnValue = true;
                    return false;
                }
            });

            //checking background colour is white
            colourStyles = letterContentHTML
               .replace(letterDatePlaceHolderHtml, "")
               .match(/background-color: #......|background-color: rgb\(.{7,13}\)/g);
            
            $(colourStyles).each(function () {
                var colour = this.valueOf().split(":")[1].trim();
                if (!isColourWhite(colour)) {
                    returnValue = true;
                    return false;
                }
            });

            return returnValue;
        },
    };
})();