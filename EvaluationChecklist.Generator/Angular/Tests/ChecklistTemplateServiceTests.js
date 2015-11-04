describe('Checklist template service tests', function () {
    var checklistTemplateService;
    var $httpBackend;
    var $rootScope;

    //mock local Storage
    var createLocalStorageMock = function () {
        return MockFactory.createLocalStorageMock();
    };

    beforeEach(function () {
        module('checklistTemplateService');
        module('configService');
        module('clientQuestionService');
        module('checklistService');

        windowMock = MockFactory.createWindowMock();

        module(function ($provide) {
            $provide.value('$window', windowMock);
            $provide.value('$modal', {});
        });

    });

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        checklistTemplateService = $injector.get("ChecklistTemplateService");

        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };

    }));

    var createQuestionWithIdOnly = function () {
        return { "Id": guid() };
    }

    var createQuestion = function () {
        return { "Id": guid(), "Title": null };
    }

    var createChecklistTemplate = function () {
        return {
            "Id": guid(),
            "Deleted": false,
            "Draft": false,
            "Questions": []
        };

    };

    it('Given a question and template when updateTemplateQuestion then correct api is called', function () {
        //GIVEN
        var templateId = 1312312;
        var question = { "Id": guid() };
        var exclude = true;

        var expectedPayload = { "TemplateId": templateId, "QuestionId": question.Id, "Exclude": exclude };
        $httpBackend.expectPOST("api/template/updatequestion", expectedPayload).respond({});

        //WHEN
        checklistTemplateService.updateTemplateQuestion(templateId, question, exclude);

        //THEN
        $httpBackend.verifyNoOutstandingExpectation();
    });

    it('Given online when getTemplatesWithOnlyIds then templates retrieved from server', function () {
        //GIVEN
        windowMock.navigator.onLine = true;
        var checklistTemplate = createChecklistTemplate();
        checklistTemplate.Draft = false;
        checklistTemplate.Title = "Space";

        $httpBackend.whenGET('api/checklisttemplate/getwithquestionids').respond([checklistTemplate]);

        //WHEN
        var result = null;
        checklistTemplateService.getTemplatesWithOnlyQuestionIds(function (templates) {
            result = templates;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return result != null;
        }, "template api call to complete", 500);

        //THEN
        expect(result).toNotBe(null);
        expect(result.length).toBe(1);
    });

    it('Given offline when getTemplatesWithOnlyIds then templates retrieved from local storage', function () {
        //GIVEN
        windowMock.navigator.onLine = false;
        windowMock.localStorage.setItem("ChecklistTemplate.Space", JSON.stringify({ "Id": 123123 }));
        windowMock.localStorage.setItem("ChecklistTemplate.TheFinalFrontier", JSON.stringify({ "Id": 43252435 }));

        $rootScope.online = false;
        
        //WHEN
        var result = null;
        checklistTemplateService.getTemplatesWithOnlyQuestionIds(function (templates) {
            result = templates;
        });

        waitsFor(function () {
            return result != null;
        }, "template api call to complete", 500);

        //THEN
        expect(result).toNotBe(null);
        expect(result.length).toBe(2);


    });

    it('Given online when get then templates retrieved from api', function () {
        //GIVEN
        windowMock.navigator.onLine = true;
        var checklistTemplate = createChecklistTemplate();
        checklistTemplate.Draft = false;
        checklistTemplate.Title = "Space";
        checklistTemplate.Questions.push(createQuestion());
        checklistTemplate.Questions.push(createQuestion());

        $httpBackend.whenGET('api/checklisttemplate/' + checklistTemplate.Id).respond([checklistTemplate]);

        //WHEN
        var result = null;
        checklistTemplateService.get(checklistTemplate.Id, function (templates) {
            result = templates;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return result != null;
        }, "template api call to complete", 500);

        //THEN
        expect(result).toNotBe(null);
        expect(result.length).toBe(1);
        expect(result[0].Questions.length).toBe(2);
        expect(result[0].Questions[0].Title).toBeDefined();
    });

    it('Given offline when get then templates retrieved from local storage', function () {
        //GIVEN
        windowMock.navigator.onLine = false;
        $rootScope.online = false;

        var minifiedQuestion = createQuestionWithIdOnly();
        var checklistTemplate = createChecklistTemplate();
        checklistTemplate.Draft = false;
        checklistTemplate.Title = "Space";
        checklistTemplate.Questions.push(minifiedQuestion);

        windowMock.localStorage.setItem("ChecklistTemplate.Space", JSON.stringify(checklistTemplate));

        var question = createQuestion();
        question.Id = minifiedQuestion.Id
        question.Title = "the question title";
        windowMock.localStorage.setItem('CompleteSetOfQuestions', JSON.stringify([question]));

        //WHEN
        var result = null;
        checklistTemplateService.get(checklistTemplate.Id, function (templates) {
            result = templates;
        });

        waitsFor(function () {
            return result != null;
        }, "template api call to complete", 500);

        //THEN
        expect(result).toNotBe(null);
        expect(result.Questions.length).toBe(1);
        expect(result.Questions[0].Title).toBeDefined("Question title not inflated");


    });
});



