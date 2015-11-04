describe('Industry service', function () {

    var industryService;
    var $httpBackend;
    var config;
    var windowMock;

    //mock local Storage
    var createLocalStorageMock = function() {
        return MockFactory.createLocalStorageMock();
    };


    beforeEach(function () {
        windowMock = MockFactory.createWindowMock();

        module('industryService');
        module('configService');
        module(function ($provide) {
            $provide.value('$window', windowMock);
        });
    });


    beforeEach(inject(function ($injector) {

        $httpBackend = $injector.get('$httpBackend');
        var configService = $injector.get('ConfigService');
        config = configService.getConfig();

        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };

        industryService = $injector.get("IndustryService");

    }));

    it('Given client id when get then calls correct api', function () {
        //given
        var clientId = 1234;

        //when, then
        $httpBackend.whenGET(config.apiUrl + 'industries').respond({});

        var result = industryService.get();
    });


    it('Given industry id when getQuestions then returns industry questions from local storage', function () {
        //given
        var industry = "SGGCo";

        //save to local storage
        windowMock.localStorage.setItem("Industry:" + industry, JSON.stringify(industryQuestion));

        //when, then      
        var result = industryService.getIndustry(industry, null);

        expect(result).toNotBe(null);
        expect(result.Questions[0].Question.Id).toEqual("c1b23d84-e8bb-4f9c-8196-58ba6a0338e2");
    });


    it('Given industry id when getQuestions and no questions stored in local storage then returns industry questions from server', function () {
        //given
        var industryName = "SGGCo";

        $httpBackend.whenGET(config.apiUrl + 'industries').respond([industryQuestion]);

        //when, then  
        var result = null;
        industryService.getIndustry(industryName, function (industryObject) {
            result = industryObject;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return result != null;
        }, "industry api call to complete", 500);

        expect(result).toNotBe(null);
        expect(result.Questions[0].Question.Id).toEqual("c1b23d84-e8bb-4f9c-8196-58ba6a0338e2");

        //clean up test
        // localStorage.removeItem("Industry:" + industryName);
    });

    it('Given offline when getIndustries then returns industry questions from local storage', function () {
        //given
        windowMock.navigator.onLine = false;
        windowMock.localStorage.setItem("Industry1", JSON.stringify({ "Id": 123123 }));
        $rootScope.online = false;

        ////when, then  
        var result = null;
        industryService.get(function (industries) {
            result = industries;
        });

        //$httpBackend.flush();

        waitsFor(function () {
            return result != null;
        }, "industry api call to complete", 500);

        expect(result).toNotBe(null);
        expect(result.length).toBe(1);

        ////clean up test
        //localStorage.removeItem("Industry:" + industryName);

        $httpBackend.verifyNoOutstandingExpectation();
    });

    it('Given online when getIndustries then draft industry templates are not saved to local storage', function () {
        //given
        windowMock.navigator.onLine = true;
        var industryTemplate = createIndustryTemplate();
        industryTemplate.Draft = true;
        industryTemplate.Title = "Space";
        $httpBackend.whenGET('api/industries').respond([industryTemplate]);

        //when, then  
        var result = null;
        industryService.get(function (industries) {
            result = industries;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return result != null;
        }, "industry api call to complete", 500);

        expect(result).toNotBe(null);
        expect(result.length).toBe(1);
        expect(windowMock.localStorage.getItem('Industry:' + industryTemplate.Title)).toBe(null);

        $httpBackend.verifyNoOutstandingExpectation();
    });

    it('Given online when getIndustries then live industry templates are saved to local storage', function () {
        //given
        windowMock.navigator.onLine = true;
        var industryTemplate = createIndustryTemplate();
        industryTemplate.Draft = false;
        industryTemplate.Title = "Space";
        $httpBackend.whenGET('api/industries').respond([industryTemplate]);

        //when, then  
        var result = null;
        industryService.get(function (industries) {
            result = industries;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return result != null;
        }, "industry api call to complete", 500);

        expect(result).toNotBe(null);
        expect(result.length).toBe(1);
        expect(windowMock.localStorage.getItem('Industry:' + industryTemplate.Title)).toNotBe(null);

        $httpBackend.verifyNoOutstandingExpectation();
    });

    var createIndustryTemplate = function () {
        return {
            "Id": guid(),
            "Deleted": false,
            "Draft": false
        };

    };

    var industryQuestion = {
        "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
        "ClientId": 33749,
        "SiteId": null,
        "Title": "SGGCo",
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
                        "Title": "SGGCo",
                        "Questions": [

                        ]
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
        "SiteVisit": {
            "SelectedImpressionType": null
        }
    };


    var createChecklist = function () {
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
