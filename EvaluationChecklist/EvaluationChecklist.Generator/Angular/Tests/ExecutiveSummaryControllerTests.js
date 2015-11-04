describe('Executive summary controller tests ', function () {

    var $httpBackend, $routeParameters, $rootScope;

    var createChecklist = function () {
        return SafecheckObjectFactory.createChecklist();
    };

    var createQuestionAnswer = function() {
        return SafecheckObjectFactory.createQuestionAnswer();
    };

    var createNeutralQuestionAnswer = function() {
        var questionAnswer = createQuestionAnswer();
        questionAnswer.Answer.Response.ResponseType = "neutral";
        return questionAnswer;
    };

    var createPositiveQuestionAnswer = function() {
        var questionAnswer = createQuestionAnswer();
        questionAnswer.Answer.Response.ResponseType = "Positive";
        return questionAnswer;
    };

    var createNegativeQuestionAnswer = function() {
        var questionAnswer = createQuestionAnswer();
        questionAnswer.Answer.Response.ResponseType = "Negative";
        return questionAnswer;
    };

    var createPersonSeen = function () {
        return SafecheckObjectFactory.createPersonSeen();
    };

    beforeEach(function () {
        module('configService');
        module('clientQuestionService');
        module('clientServiceREST');
        module('clientemployeeService');
        module('checklistTemplateService');
        module('checklistService');
        module('executiveSummaryService');
        module('ui.tinymce');
        module('questionService');

        module(function ($provide) {
            $provide.value('$modal', {}); //mock the modal because it calls methods of the windowMock that aren't defined
        });

    });

    beforeEach(inject(function ($injector) {
        // Get hold of a scope (i.e. the root scope)
        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };

        
        $httpBackend = $injector.get('$httpBackend');

        $httpBackend.whenGET('api/checklists/undefined').respond({});

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');


        createController = function () {
            return $controller('ExecutiveSummaryController', { '$scope': $rootScope });
        };

    }));


    it('Given a checklist when count compliance items of status then_correct_count_returned', function () {
        //GIVEN
        var checklist = createChecklist();
        checklist.Questions.push(createNeutralQuestionAnswer());
        checklist.Questions.push(createNeutralQuestionAnswer());
        checklist.Questions.push(createNeutralQuestionAnswer());
        checklist.Questions.push(createNegativeQuestionAnswer());
        checklist.Questions.push(createPositiveQuestionAnswer());
        $rootScope.Checklist = checklist;
        var controller = createController();

        //WHEN
        var result = $rootScope.countOfResponseByType('neutral');

        expect(result).toBe(3);
    });

    it('Given a checklist with no response when count compliance items of status then_correct_count_returned', function () {
        //GIVEN
        var checklist = createChecklist();
        checklist.Questions.push(createNeutralQuestionAnswer());
        var questionAnswerWithNoResponse = createQuestionAnswer();
        var questionAnswerWithNoResponseProperty = createQuestionAnswer();
        delete questionAnswerWithNoResponseProperty.Answer.Response;

        checklist.Questions.push(questionAnswerWithNoResponse);
        checklist.Questions.push(questionAnswerWithNoResponseProperty);
        $rootScope.Checklist = checklist;
        var controller = createController();

        //WHEN
        var result = $rootScope.countOfResponseByType('neutral');

        expect(result).toBe(1);
    });

    it('Given there are multiple persons seen when getAdditionalPersonsSeenString then comma separated string is returned', function() {
        var checklist = createChecklist();
        var personSeen1 = createPersonSeen();
        personSeen1.FullName = "Cain";

        var personSeen2 = createPersonSeen();
        personSeen2.FullName = "Able";

        var personSeen3 = createPersonSeen();
        personSeen3.FullName = "Moses";

        checklist.PersonsSeen.push(personSeen1);
        checklist.PersonsSeen.push(personSeen2);
        checklist.PersonsSeen.push(personSeen3);

        $rootScope.Checklist = checklist;
         var controller = createController();

        //WHEN
        var result = $rootScope.getAdditionalPersonsSeenString();

        //THEN
        expect(result).toBe("Cain, Able, Moses");
    });
    it('Given there is one persons seen when getAdditionalPersonsSeenString then their name is returned', function () {
        var checklist = createChecklist();
        var personSeen1 = createPersonSeen();
        personSeen1.FullName = "Cain";

        checklist.PersonsSeen.push(personSeen1);

        $rootScope.Checklist = checklist;
        var controller = createController();

        //WHEN
        var result = $rootScope.getAdditionalPersonsSeenString();

        //THEN
        expect(result).toBe("Cain");
    });

    it('Given includeGuidanceNotes is false in checklist includeGuidanceNotes method returns false', function () {
        var checklist = createChecklist();
        checklist.IncludeGuidanceNotes = false;

        $rootScope.Checklist = checklist;
        var controller = createController();

        //WHEN
        var result = $rootScope.showGuidanceNotes();
        
        //THEN
        expect(result).toBe(false);
    });
});
