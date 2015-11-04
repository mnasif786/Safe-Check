describe('local storage tests', function () {

    var $httpBackend;
    var config;
    var checklistService;
    var industryService;

    beforeEach(function () {
        module('ngResource');
        module('clientServiceREST');
        module('configService');
        module('checklistService');
        module('configService');
        module('industryService');
    });

    beforeEach(inject(function ($injector) {

        checklistService = $injector.get("ChecklistService");
        industryService = $injector.get("IndustryService");
        $httpBackend = $injector.get('$httpBackend');
        var configService = $injector.get('ConfigService');
        config = configService.getConfig();

        $httpBackend.whenGET(config.apiUrl + 'industries').respond(404, createChecklist());



    }));

    xit('Given i create new checklists then how many can be saved to local storage', function () {
        industryService.get(function (industries) {
            for (var i = 0; i <= 2; i++) {
                var checklist = checklistService.create(11, 22, new Date(), "Mr health and safety", null);
                
                checklistService.addQuestions(checklist, industries[0].Questions);
                localStorage.setItem("Checklist." + checklist.Id, JSON.stringify(checklist));
            }
        }
        );

        $httpBackend.flush();

    });

   
    var createChecklist = function() {
        return {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "ClientId": 33749,
            "SiteId": null,
            "Questions": [
                {
                    "Question": {
                        "Id": "c1b23d84-e8bb-4f9c-8196-58ba6a0338e2",
                        "Text": "If required, is there a suitable asbestos management plan in place?",
                        "PossibleResponses": [
                                                {
                                                    "Id": "59b85816-fb65-4e67-b965-0144f38c823e",
                                                    "Title": "Unacceptable",
                                                    "SupportingEvidence": "",
                                                    "ActionRequired": "A management plan will be required based on the survey undertaken by a registered asbestos contractor. Actions on the plan should be implemented.",
                                                    "ResponseType": "Negative",
                                                    "GuidanceNotes": "5.16",
                                                    "ReportLetterStatement": "No asbestos management plan in place",
                                                    "ReportLetterStatementCategory": null,
                                                    "$$hashKey": "03F"
                                                },
                                                {
                                                    "Id": "70bda128-a30b-4e66-b2f5-323ab7975b32",
                                                    "Title": "Acceptable",
                                                    "SupportingEvidence": "A management plan is in place.",
                                                    "ActionRequired": "",
                                                    "ResponseType": "Positive",
                                                    "GuidanceNotes": "5.16",
                                                    "ReportLetterStatement": "",
                                                    "ReportLetterStatementCategory": null,
                                                    "$$hashKey": "03C"
                                                }
                                            ],
                        "CategoryId": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                        "Category": {
                            "Id": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                            "Title": "Care",
                            "Questions": []
                        },
                        "Mandatory": false,
                        "SpecificToClientId": null
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "Comment": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    }
                }
            ],
            "SiteVisit": { "SelectedImpressionType": null }
        };
    };
});
