describe('Add Edit Controller tests', function () {

    var question = null;
    var acceptableResponseId = "6351e2d7-f0ee-4517-a5a3-efc1850c3a42";
    var $rootScope;

    var mockQuestionService = {
        get: function (id, callback) {
            callback(question);
        }
    };

    beforeEach(inject(function ($injector) {

        question = {
            "Id": "2e50bb04-a611-463d-ba05-0371aa768599",
            "Text": "Has each pressure system been subject to a written scheme of examination?",
            "PossibleResponses": [
                {
                    "Id": "f274df06-b910-4a3c-aade-1458dbf4aea7",
                    "Title": "Unacceptable",
                    "SupportingEvidence": "",
                    "ActionRequired": "Each system should be subject to a written scheme.",
                    "ResponseType": "Negative",
                    "GuidanceNotes": "4.16",
                    "ReportLetterStatement": "No Written Scheme of Examination for pressure system(s)",
                    "ReportLetterStatementCategory": "Management of Health and Safety Documentation"
                },
                {
                    "Id": "af905703-0954-4901-a2e1-1c3aeafc9324",
                    "Title": "Not Applicable",
                    "SupportingEvidence": "",
                    "ActionRequired": "",
                    "ResponseType": "Neutral",
                    "GuidanceNotes": "4.16",
                    "ReportLetterStatement": "",
                    "ReportLetterStatementCategory": ""
                },
                {
                    "Id": acceptableResponseId,
                    "Title": "Acceptable",
                    "SupportingEvidence": "Suitable documentation is in place.",
                    "ActionRequired": "",
                    "ResponseType": "Positive",
                    "GuidanceNotes": "4.16",
                    "ReportLetterStatement": "",
                    "ReportLetterStatementCategory": ""
                }
            ],
            "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383",
            "Category": {
                "Id": "2efb7c62-e57a-4e7a-b712-06d143fc9383",
                "Title": "Documentation",
                "Questions": [
                ],
                "OrderNumber": 1,
                "TabTitle": "DOCS"
            },
            "Mandatory": true,
            "SpecificToClientId": null,
            "OrderNumber": 19,
            "Deleted": false,
            "CustomQuestion": false,
            "IndustryTemplates": [],
            "Industries": {
                "IndustryIds" :[]
            }
            
        };

        $modalInstance = {
            "close": function () { }
        };

        $rootScope = $injector.get('$rootScope');
        $rootScope.categories = [];
        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');
        createController = function () {
            return $controller('AddEditQuestionController', { '$scope': $rootScope, "$modalInstance": $modalInstance, 'QuestionService': mockQuestionService, 'question': question, 'ChecklistTemplateService': {} });
        };

    }));

    it('Given mandatory fields are not supplied when save then correct number of alerts are displayed', function () {
        //given
        question.Text = '';
        question.Category = angular.undefined;
        question.AreaOfNonComplianceHeadingId = angular.undefined;
        question.AcceptableEnabled = angular.undefined;

        //when

        var controller = createController();
        $rootScope.categories = [];
        $rootScope.save();
        //then
        expect($rootScope.modalAlerts.length).toBe(4);
    });
});