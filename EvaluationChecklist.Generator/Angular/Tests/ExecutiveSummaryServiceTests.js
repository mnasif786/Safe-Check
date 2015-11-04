describe('Executive summary service tests', function () {

    var executiveSummaryService, questionService;
    var $httpBackend;
    var configService;
    var config
    var $rootScope;

    beforeEach(function () {
        module('executiveSummaryService');
        module('configService');
        module('questionService');
    });

    beforeEach(inject(function ($injector) {
        executiveSummaryService = $injector.get("ExecutiveSummaryService");
        configService = $injector.get('ConfigService');
        config = configService.getConfig();
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');

        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };

    }));

    it('Given a user when get templates then template list returns BusinessSafe123 template', function () {

        //when
        var result = executiveSummaryService.getTemplates();
        //then
        expect(result).toBeDefined();
        expect(result).toNotBe(null);

        var executiveSummaryTemplate;
        $.each(result, function(index, value) {
            if (value.Id == "BusinessSafe123") {
                executiveSummaryTemplate = value;
                return false;
            }
        });

        expect(executiveSummaryTemplate).toBeDefined();
        expect(executiveSummaryTemplate).toNotBe(null);
        expect(executiveSummaryTemplate.Title).toEqual("GB BusinessSafe 123");

    });

    it('Given a checklist when generate letter from BusinessSafe123 template then html is returned', function () {

        //given
        $httpBackend.expectGET(config.apiUrl + 'headings').respond({});

        var checklist = createChecklist();
        //when
        var result = executiveSummaryService.generateLetter("BusinessSafe123", checklist);

        //then
        expect(result).toBeDefined();
        expect(result.content).toNotBe(null);
    });

    it('given a report statement category when getReportLetterStatementsByCategory then return an array of report letter statements categories ', function () {

        var reportLetterStatementCategory = "ReportLetterStatementCategory 1";
        var expectedLetterStatement = "No asbestos management plan in place";

        var questions = [{
            "Question": {
                "Id": 2, "PossibleResponses": []
            }, "Answer": {
                "Id": null,
                "SelectedResponseId": null,
                "Comment": "",
                "QuestionId": "41cd99a7-ef44-4404-a382-13773bb86ef9",
                "Response": {
                    "Id": "59b85816-fb65-4e67-b965-0144f38c823e",
                    "Title": "Unacceptable",
                    "SupportingEvidence": "",
                    "ActionRequired": "A management plan will be required based on the survey undertaken by a registered asbestos contractor. Actions on the plan should be implemented.",
                    "ResponseType": "Negative",
                    "GuidanceNotes": "5.16",
                    "ReportLetterStatement": expectedLetterStatement,
                    "ReportLetterStatementCategory": reportLetterStatementCategory
                },
                "AreaOfNonCompliance": null
            }
        },
        {
            "Question": {
                "Id": 3, "PossibleResponses": []
            }, "Answer": {
                "Id": null,
                "SelectedResponseId": null,
                "Comment": "",
                "QuestionId": "41cd99a7-ef44-4404-a382-13773bb86ef9"
            }
        },
         {
             "Question": {
                 "Id": 4, "PossibleResponses": []
             }, "Answer": {
                 "Id": null,
                 "SelectedResponseId": null,
                 "Comment": "",
                 "QuestionId": "41cd99a7-ef44-4404-a382-13773bb86ef9",
                 "Response": {
                     "Id": "59b85816-fb65-4e67-b965-0144f38c823e",
                     "Title": "Unacceptable",
                     "SupportingEvidence": "",
                     "ActionRequired": "A management plan will be required based on the survey undertaken by a registered asbestos contractor. Actions on the plan should be implemented.",
                     "ResponseType": "Negative",
                     "GuidanceNotes": "5.16",
                     "ReportLetterStatement": "No asbestos management plan in place 2",
                     "ReportLetterStatementCategory": null
                 }
             }
         }
        ];


        var letterStatements = executiveSummaryService.getReportLetterStatementsByCategory(questions, reportLetterStatementCategory);

        expect(letterStatements).toBeDefined();
        expect(letterStatements.length).toBe(1);
        expect(letterStatements[0]).toEqual(expectedLetterStatement);


    });

    it('given an answer has area of non-compliance when getReportLetterStatementsByCategory then returned an array should contain the area of non-compliance', function () {

        var reportLetterStatementCategory = "ReportLetterStatementCategory 1";
        var expectedLetterStatement = "Serve the public trust";

        var questions = [{
            "Question": {
                "Id": 2, "PossibleResponses": []
            }, "Answer": {
                "Id": null,
                "SelectedResponseId": null,
                "Comment": "",
                "QuestionId": "41cd99a7-ef44-4404-a382-13773bb86ef9",
                "Response": {
                    "Id": "59b85816-fb65-4e67-b965-0144f38c823e",
                    "Title": "Unacceptable",
                    "SupportingEvidence": "",
                    "ActionRequired": "A management plan will be required based on the survey undertaken by a registered asbestos contractor. Actions on the plan should be implemented.",
                    "ResponseType": "Negative",
                    "GuidanceNotes": "5.16",
                    "ReportLetterStatement": "No asbestos management plan in place",
                    "ReportLetterStatementCategory": reportLetterStatementCategory
                },
                "AreaOfNonCompliance": expectedLetterStatement
            }
        },
        {
            "Question": {
                "Id": 3, "PossibleResponses": []
            }, "Answer": {
                "Id": null,
                "SelectedResponseId": null,
                "Comment": "",
                "QuestionId": "41cd99a7-ef44-4404-a382-13773bb86ef9"
            }
        }];


        var letterStatements = executiveSummaryService.getReportLetterStatementsByCategory(questions, reportLetterStatementCategory);

        expect(letterStatements).toBeDefined();
        expect(letterStatements.length).toBe(1);
        expect(letterStatements[0]).toEqual(expectedLetterStatement);


    });

    it('Given a checklist with overall impression when generate letter from BusinessSafe123 template then html contains impression text', function () {

        //given
        $httpBackend.expectGET(config.apiUrl + 'headings').respond([{ 'one': 1 }, { 'two': 2}]);

        var checklist = createChecklist();

        var impressionText = "KLJLSDKJFLKSDJFL";
        checklist.SiteVisit.SelectedImpressionType = { "Comments": impressionText };
        //when
        var result = '';
        var complete = false;
        var promise = executiveSummaryService.generateLetter("BusinessSafe123", checklist);

        promise.then(function (data) {
            result = data;
            complete = true;
        });

        $httpBackend.flush();
        $rootScope.$apply();

        waitsFor(function () {
            return complete;
        }, "executiveSummaryService api call to complete", 500);

        //then
        expect(result.content).toContain(impressionText);

    });

    it('Given a checklist is of type FatFace then ensure includeGuidanceNotes set to false', function() {
        //when
        var result = executiveSummaryService.getTemplates();
        //then
        expect(result).toBeDefined();
        expect(result).toNotBe(null);

        var executiveSummaryTemplate;
        $.each(result, function(index, value) {
            if (value.Id == "FatFace") {
                executiveSummaryTemplate = value;
                return false;
            }
        });

        expect(executiveSummaryTemplate).toBeDefined();
        expect(executiveSummaryTemplate).toNotBe(null);
        expect(executiveSummaryTemplate.Title).toEqual("Fat Face");
        expect(executiveSummaryTemplate.IncludeGuidanceNotes).toEqual(false);
    });
    
    var createChecklist = function () {
        return {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "ClientId": 33749,
            "ClientLogFilename": null,
            "SiteId": null,
            "Categories": [],
            "Questions": [],
            "SiteVisit": { "SelectedImpressionType": { "Comments": "" }, "PersonSeen": null }
        };
    };
});
