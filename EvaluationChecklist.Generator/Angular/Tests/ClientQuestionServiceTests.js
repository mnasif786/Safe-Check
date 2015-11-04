describe('Client questions service', function () {

    var clientQuestionService;
    var $httpBackend;
    var config;
    var windowMock;
    var $rootScope;

    //mock local Storage
    var createLocalStorageMock = function() {
        return MockFactory.createLocalStorageMock();
    };

    beforeEach(function () {
        //  module('ngResource');
        module('configService');

        module('clientQuestionService', function ($provide) {
            windowMock = MockFactory.createWindowMock();

            $provide.value('$window', windowMock);
            $provide.value('$modal', {}); //mock the modal because it calls methods of the windowMock that aren't defined
        });
    });

    beforeEach(inject(function ($injector) {

        clientQuestionService = $injector.get("ClientQuestionService");
        $httpBackend = $injector.get('$httpBackend');
        var configService = $injector.get('ConfigService');
        config = configService.getConfig();

        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };

    }));

    it('Given nothing in local storage when get all then list of client questions returned and stored to local storage', function () {

        //given
        var clientCAN = "ABC234";
        //remove from local storage before commencing test

        var clientKey = "clientquestions:" + clientCAN;
        localStorage.removeItem(clientKey);


        //when
        $httpBackend.whenGET(config.apiUrl + 'client/questions').respond([clientQuestion]);

        var result = null;
        clientQuestionService.get(function (clientQuestions) {
            result = clientQuestions;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return result != null;
        }, "get client questions api call to complete", 500);

        //, then
        //verify in local storage

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].Questions[0]).toNotBe(null);

        expect(localStorage[clientKey]).toNotBe(null);


        //clean up test
        localStorage.removeItem(clientKey);
    });

    it('Given client questions exist in local storage when get client questions by client CAN then client questions are returned',
       function () {
           var clientCAN = "ABC234";

           //remove from local storage before commencing test
           var clientKey = "clientquestions:" + clientCAN;
           localStorage.removeItem(clientKey);

           // add questions to local storage
           localStorage[clientKey] = JSON.stringify(clientQuestion);


           //when
           //$httpBackend.whenGET(config.apiUrl + 'client/questions').respond([clientQuestion]);

           var result = null;
           clientQuestionService.getByClientAccountNumber(clientCAN, function (clientQuestions) {
               result = clientQuestions;
           });



           waitsFor(function () {
               return result != null;
           }, "get client questions api call to complete", 500);

           //, then           
           expect(result).toNotBe(null);
           expect(result.Questions[0]).toNotBe(null);

           //clean up test
           localStorage.removeItem(clientKey);
       });


    it('Given nothing in local storage when get client questions by client CAN then client questions are returned',
        function () {
            var clientCAN = "DEN101";
            //remove from local storage before commencing test

            var clientKey = "clientquestions:" + clientCAN;
            localStorage.removeItem(clientKey);


            //when
            $httpBackend.whenGET(config.apiUrl + 'client/questions').respond([clientQuestion]);

            var result = null;
            clientQuestionService.getByClientAccountNumber(clientCAN, function (clientQuestions) {
                result = clientQuestions;
            });

            $httpBackend.flush();

            waitsFor(function () {
                return result != null;
            }, "get client questions api call to complete", 500);

            //, then
            //verify in local storage

            expect(result).toNotBe(null);
            expect(result.Questions[0]).toNotBe(null);

            //clean up test
            localStorage.removeItem(clientKey);
        });


    xit('Given industry id when getQuestions then returns industry questions from local storage', function () {
        //given
        var industry = "SGGCo";

        //save to local storage
        localStorage.setItem("Industry:" + industry, JSON.stringify(industryQuestion));

        //when, then      
        var result = industryService.getIndustry(industry, null);


        expect(result).toNotBe(null);
        expect(result.Questions[0].Question.Id).toEqual("c1b23d84-e8bb-4f9c-8196-58ba6a0338e2");

        //clean up test
        localStorage.removeItem("Industry:" + industry);
    });


    xit('Given industry id when getQuestions and no questions stored in local storage then returns industry questions from server', function () {
        //given
        var industryName = "SGGCo";
        localStorage.removeItem("Industry:" + industryName);

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
        localStorage.removeItem("Industry:" + industryName);
    });


    it('Given offline when get complete set of questions service is not called', function () {
        windowMock.navigator.onLine = false;
        $rootScope.online = false;
        //given
        windowMock.localStorage.setItem("CompleteSetOfQuestions", JSON.stringify([]));

        var complete = false;
        var result = null;
        clientQuestionService.getCompleteSetOfQuestions(function (data) {
            result = data;
            complete = true;
        });

        waitsFor(function () {
            return complete;
        }, "get client questions api call to complete", 500);

        expect(result).not.toBeNull();

    });

    it('Given online when get complete set of questions service is called', function () {

        $httpBackend.whenGET("api/completesetofquestions").respond([{ 'one': 1 }, { 'two': 2}]);

        windowMock.navigator.onLine = true;
        //given

        var complete = false;
        var result = null;

        clientQuestionService.getCompleteSetOfQuestions(function (data) {
            result = data;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "get client questions api call to complete", 500);

        expect(result.length).toBe(2);
    });

    var clientQuestion = {
        "ClientId": 55881,
        "ClientAccountNumber": "DEN101",
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
