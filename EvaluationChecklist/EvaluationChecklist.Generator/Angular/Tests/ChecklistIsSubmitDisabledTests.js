describe('Checklist controller isSubmitDisabled tests', function () {
    var $httpBackend, $rootScope, $modal, createController, config, impressionTypeService, checklistService, $window, questionService;
    var checklistId = guid();

    beforeEach(function () {
        //  module('ngResource');
        module('clientServiceREST');
        module('checklistService');
        module('templateService');
        module('configService');
        module('accountService');
        module('impressiontypeservice');
        module('executiveSummaryService');
        module('ui.bootstrap.modal');
        module('clientQuestionService');
        module('clientemployeeService');
        module('checklistTemplateService');
        module('questionService');

    });

    beforeEach(inject(function ($injector, ClientServiceREST) {
        var configService = $injector.get('ConfigService');
        config = configService.getConfig();

        var $routeParameters = $injector.get("$routeParams");
        //var ClientServiceREST = $injector.get("ClientServiceREST");

        $routeParameters.Id = checklistId;

        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

        // backend definition common for all tests
        $httpBackend.whenGET(config.apiUrl + 'checklists/' + checklistId).respond({ "Id": checklistId, "SiteVisit": { "SelectedImpressionType": null } });
        $httpBackend.whenGET(config.apiUrl + 'categories').respond({ "Id": checklistId });
        $httpBackend.whenGET(config.apiUrl + 'impressions').respond({});
        $httpBackend.whenPOST(config.apiUrl + 'checklists/' + checklistId).respond({});
        $httpBackend.whenPOST(config.apiUrl + 'updaterequirenotification/checklist/' + checklistId).respond({});

        //these are javascript regular expressions
        $httpBackend.whenGET(/\/api\/clients.*/i).respond({});

        //this will log the url called, useful for debugging purposes
        $httpBackend.whenGET(/.*/).respond(function (method, url, data, headers) {
            console.log("URL " + url);
            return [{}];
        });

        // Get hold of a scope (i.e. the root scope)
        $rootScope = $injector.get('$rootScope');
        $rootScope.blockUI = function () { };
        $rootScope.unblockUI = function () { };

        $modal = $injector.get('$modal');
        $location = $injector.get('$location');

        checklistService = $injector.get('ChecklistService');
        impressionTypeService = $injector.get('ImpressionTypeService');
        checklistTemplateService = $injector.get('ChecklistTemplateService');
        questionService = $injector.get('QuestionService');

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');

        $window = $injector.get('$window');
        spyOn($window, 'alert');

        $rootScope.user = new User("Hq", "john", "smith");
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };

        createController = function () {
            return $controller('ChecklistController', { '$scope': $rootScope, '$modal': $modal, '$location': $location, 'ImpressionTypeService': impressionTypeService, 'ChecklistService': checklistService, "ChecklistTemplateService": checklistTemplateService });
        };

    }));

    it('Given Executive Summary Updates Required and not resolved then isSubmitDisabled equals true', function() {
        //GIVEN
        var controller = createController();

        $rootScope.readyToSubmit = true; // initialised to check status is changed

        $rootScope.Checklist = SafecheckObjectFactory.createChecklist();
        $rootScope.Checklist.Status = "Completed";
        $rootScope.Checklist.Questions = [];
        $rootScope.Checklist.ExecutiveSummaryUpdateRequired = true;
        $rootScope.Checklist.ExecutiveSummaryQASignedOffBy = null;
        $rootScope.Checklist.ExecutiveSummaryQASignedOffDate = null;
        $rootScope.Checklist.ExecutiveSummaryQACommentsResolved = false;
       
        
        //when
        var result = $rootScope.isSubmitDisabled();

        //THEN       
        expect(result).toEqual(true);

    });

    it('Given Executive Summary Updates Required and Comments signed off by QA then isSubmitDisabled equals false', function() {
        //GIVEN

        var controller = createController();

        $rootScope.readyToSubmit = true; // simulate checkbox being selected
        $rootScope.Checklist = SafecheckObjectFactory.createChecklist();
        $rootScope.Checklist.Status = "Completed";
        $rootScope.Checklist.Questions = [];
        $rootScope.Checklist.ExecutiveSummaryUpdateRequired = true;
        $rootScope.Checklist.ExecutiveSummaryQASignedOffBy = "Scooby Doo";
        $rootScope.Checklist.ExecutiveSummaryQASignedOffDate = "01/02/2014";
        $rootScope.Checklist.ExecutiveSummaryQACommentsResolved = true;

        //when
        var result = $rootScope.isSubmitDisabled();

        //THEN
        expect(result).toEqual(false);

    });

    it('Given checklist has unresolved questions then isSubmitDisabled equals true', function () {
        //GIVEN
        var controller = createController();
        var questionAnswer = SafecheckObjectFactory.createQuestionAnswer();
        questionAnswer.Answer.QaComments = "Fix this amigo";


        $rootScope.Checklist = SafecheckObjectFactory.createChecklist();
        $rootScope.Checklist.Status = "Completed";
        $rootScope.Checklist.Questions = [questionAnswer];

        //when
        var result = $rootScope.isSubmitDisabled();

        //THEN
        expect(result).toEqual(true);
    });

    it('Given checklist has QAsigned off questions then isSubmitDisabled equals false', function () {
        //GIVEN
        var controller = createController();
        var questionAnswer = SafecheckObjectFactory.createQuestionAnswer();
        questionAnswer.Answer.QaComments = "Fix this amigo";
        questionAnswer.Answer.QaSignedOffBy = "Bob Diamond";


        $rootScope.Checklist = SafecheckObjectFactory.createChecklist();
        $rootScope.Checklist.Status = "Completed";
        $rootScope.Checklist.Questions = [questionAnswer];

        //when
        var result = $rootScope.isSubmitDisabled();

        //THEN
        expect(result).toEqual(false);
    });


    it('Given checklist is draft and no QAComments then isSubmitDisabled equals true', function () {
        //GIVEN
        var controller = createController();
        $rootScope.Checklist = SafecheckObjectFactory.createChecklist();
        $rootScope.Checklist.Status = "Draft";
        $rootScope.Checklist.Questions = [];

        //when
        var result = $rootScope.isSubmitDisabled();
        
        //THEN
        expect(result).toEqual(true);

    });

    it('Given checklist is completed and no QAComments then isSubmitDisabled equals false', function () {
        //GIVEN
        var clientId = 12314524352435;

        var controller = createController();
        $rootScope.Checklist = SafecheckObjectFactory.createChecklist();
        $rootScope.Checklist.Status = "Completed";
        $rootScope.Checklist.Questions = [];

        //when
        var result = $rootScope.isSubmitDisabled();


        //THEN
        expect(result).toEqual(false);

    });

    it('Given checklist is assigned and no QAComments then isSubmitDisabled equals false', function () {
        //GIVEN
        var controller = createController();
        $rootScope.Checklist = SafecheckObjectFactory.createChecklist();
        $rootScope.Checklist.Status = "Assigned";
        $rootScope.Checklist.Questions = [];

        //when
        var result = $rootScope.isSubmitDisabled();
        
        //THEN
        expect(result).toEqual(false);

    });
});