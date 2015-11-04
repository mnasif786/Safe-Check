describe('Create Checklist controller tests', function() {

    var $httpBackend, $rootScope, createController, config, clientServiceREST, checklistService, industryService, clientQuestionService;

    var createQuestion = function() {
        return SafecheckObjectFactory.createQuestion();
    };

    //mock local Storage
    var createLocalStorageMock = function() {
        return MockFactory.createLocalStorageMock();
    };


    var windowMock = MockFactory.createWindowMock();

    var checklistQuestionServiceMock = {
        "CompleteSetOfQuestions": [],
        getQuestionsByQuestionsArrayId: function(questionIdArray) {
            return this.CompleteSetOfQuestions;
        },
        getCompleteSetOfQuestions: function () { return this.CompleteSetOfQuestions; }

    };

    beforeEach(function () {
        module('clientServiceREST');
        module('checklistService');
        module('templateService');
        module('configService');
        module('impressiontypeservice');
        module('executiveSummaryService');
        module('ui.bootstrap.modal');
        module('clientQuestionService');
        module('industryService');
        module('checklistTemplateService');
        module('clientemployeeService');

        windowMock = MockFactory.createWindowMock();      
    });

    beforeEach(inject(function ($injector, ClientServiceREST) {
        var configService = $injector.get('ConfigService');
        config = configService.getConfig();

        var $routeParameters = $injector.get("$routeParams");

        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

        //these are javascript regular expressions
        $httpBackend.whenGET(/\/api\/clients.*/i).respond({});

        //this will log the url called, useful for debugging purposes
        $httpBackend.whenGET(/.*/).respond(function (method, url, data, headers) {
            console.log("URL " + url);
            return [{}];
        });

        // Get hold of a scope (i.e. the root scope)
        $rootScope = $injector.get('$rootScope');
        $rootScope.blockUI = function(){};
        $rootScope.unblockUI = function () { };
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };
        
        $location = $injector.get('$location');

        checklistService = $injector.get('ChecklistService');
        clientServiceREST = $injector.get('ClientServiceREST');
        industryService = $injector.get('IndustryService');

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');


        //$scope, $routeParams, $location, $timeout, $filter, ClientServiceREST, ChecklistService, IndustryService, ClientQuestionService
        createController = function () {
            return $controller('CreateChecklistController', { '$scope': $rootScope, '$location': $location, '$window': windowMock, 'ClientQuestionService': checklistQuestionServiceMock });
        };

    }));

    afterEach(function () {
        if (angular.isDefined($rootScope.Checklist)) {
            localStorage.removeItem("Checklist." + $rootScope.Checklist.Id);
        }

    });

    it('when create checklist and there is no jurisdiction selected then checklist should not be created', function () {
        //GIVEN
        var controller = createController();
        var clientId = 543;
        var siteId = 123;
        
        $rootScope.ClientDetails = { "Id": clientId };
        
        var questionsArray = [];
        questionsArray.push(createQuestion());
        checklistQuestionServiceMock.CompleteSetOfQuestions = questionsArray;

        $rootScope.CompleteSetOfQuestions = questionsArray;
        
        var questionIds = [];
        questionIds.push($rootScope.CompleteSetOfQuestions[0].Id);
        
        $rootScope.selectedIndustry = {
            "Title": "Care",
            "Questions": questionIds
        };

        $rootScope.selectedJurisdiction = null;
        
        //WHEN
        $rootScope.createNewChecklist(siteId);

        //THEN
        expect($rootScope.Checklist).toBeUndefined();


    });

    it('when create checklist and there is no deleted flag then only mandatory questions added', function () {
        //GIVEN
        var controller = createController();
        var clientId = 543;
        var siteId = 123;
        var mandatoryQuestion = createQuestion();
        mandatoryQuestion.Mandatory = true;
        delete mandatoryQuestion.Deleted; // remove the deleted property so we can mock what is returned by the api before it is updated

        var nonMandatoryQuestion = createQuestion();
        nonMandatoryQuestion.Mandatory = false;
        delete nonMandatoryQuestion.Deleted;

        $rootScope.ClientDetails = { "Id": clientId };

        var questionsArray = [];
        questionsArray.push(createQuestion());
        checklistQuestionServiceMock.CompleteSetOfQuestions = questionsArray;
        
        $rootScope.CompleteSetOfQuestions = questionsArray;
        
        var questionIds = [];
        questionIds.push($rootScope.CompleteSetOfQuestions[0].Id);
        
        $rootScope.selectedIndustry = {
            "Title": "Care",
            "Questions": questionIds
        };
        
        $rootScope.selectedJurisdiction = "UK";
        
        //WHEN
        $rootScope.createNewChecklist(siteId);

        //THEN
        expect(angular.isDefined($rootScope.Checklist)).toBe(true);
        expect($rootScope.Checklist).not.toBeNull();
        expect($rootScope.Checklist.ClientId).toBe(clientId);
        expect($rootScope.Checklist.SiteId).toBe(siteId);
        expect($rootScope.Checklist.Questions.length).toBe(1);


    });

    it('when create checklist and there IS a deleted flag then only mandatory not deleted questions added', function () {
        //GIVEN
        var controller = createController();
        var clientId = 543;
        var siteId = 123;
        
        var mandatoryQuestion = [];
        mandatoryQuestion.push(createQuestion());
        mandatoryQuestion[0].Mandatory = true;

        var deletedMandatoryQuestion = [];
        deletedMandatoryQuestion.push(createQuestion());
        deletedMandatoryQuestion[0].Mandatory = true;
        deletedMandatoryQuestion[0].Deleted = true;

        var questionArray = [];
        questionArray[0] = mandatoryQuestion[0];
        questionArray[1] = deletedMandatoryQuestion[0];

        var questionsIds = [];
        questionsIds[0] = questionArray[0].Id;
        questionsIds[1] = questionArray[1].Id;
        
        checklistQuestionServiceMock.CompleteSetOfQuestions = questionArray;
        $rootScope.CompleteSetOfQuestions = questionArray;

        var questionIds = [];
        questionIds.push($rootScope.CompleteSetOfQuestions[0].Id);

        $rootScope.ClientDetails = { "Id": clientId };
        $rootScope.selectedIndustry = {
            "Title": "Care",
            "Questions": questionsIds
        };
        
        $rootScope.selectedJurisdiction = "UK";

        //WHEN
        $rootScope.createNewChecklist(siteId);

        //THEN
        expect(angular.isDefined($rootScope.Checklist)).toBe(true);
        expect($rootScope.Checklist).not.toBeNull();
        expect($rootScope.Checklist.Questions.length).toBe(1);

    });
});
