describe('Checklist controller complete and generate checklist tests', function () {

    var $httpBackend, $rootScope, $modal, createController, config, impressionTypeService, checklistService, $window, questionService;

    var checklistId = 'aaaaaaaa-f940-4674-aeb5-7be0409e9999';

    var createChecklist = function () {
        return SafecheckObjectFactory.createChecklist();
    };

    var createOtherEmail = function () {
        return SafecheckObjectFactory.createOtherEmail();
    };

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
        $httpBackend.whenGET(config.apiUrl + 'checklists/' + checklistId).respond({ "Id": checklistId, "SiteVisit": { "SelectedImpressionType": null} });
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

    it('given unanswered question when completeAndGenerateChecklist then checklist not saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Questions[0].Question.Mandatory = false;
        $rootScope.Checklist.Questions[0].Answer.SelectedResponseId = null;

        spyOn(checklistService, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN should not save if question is unanswered'
        expect(checklistService.save).not.toHaveBeenCalled();
    });

    it('given question answered unacceptable and timescale not specfied when completeAndGenerateChecklist then checklist not saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Questions[0].Answer.Response = {
            "Id": "cc6cfd85-5ea8-490b-8f7e-b0a586466a96",
            "Title": "Unacceptable"
        };
        $rootScope.Checklist.Questions[0].Answer.SelectedResponseId = "cc6cfd85-5ea8-490b-8f7e-b0a586466a96";
        $rootScope.Checklist.Questions[0].Answer.Timescale = null;

        spyOn(checklistService, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();


        //THEN //should not save
        expect(checklistService.save).not.toHaveBeenCalled();
    });

    it('given question answered improvement required and timescale not specfied when completeAndGenerateChecklist then checklist not saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Questions[0].Answer.Response = {
            "Id": "cc6cfd85-5ea8-490b-8f7e-b0a586466a96",
            "Title": "Improvement Required"
        };
        $rootScope.Checklist.Questions[0].Answer.SelectedResponseId = "cc6cfd85-5ea8-490b-8f7e-b0a586466a96";
        $rootScope.Checklist.Questions[0].Answer.Timescale = null;

        spyOn(checklistService, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN //should not save
        expect(checklistService.save).not.toHaveBeenCalled();
    });

    it('given all question answered when completeAndGenerateChecklist then checklist saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();

        $rootScope.Checklist.Jurisdiction = "NI";
        $rootScope.Checklist.SiteVisit.VisitDate = new Date("2014-07-26T16:28:57");
        
        $rootScope.Checklist.Questions[0].Answer.Response = {
            "Id": "cc6cfd85-5ea8-490b-8f7e-b0a586466a96",
            "Title": "Acceptable"
        }; ;
        $rootScope.Checklist.Questions[0].Answer.SelectedResponseId = guid();

        spyOn(checklistService, 'save').andReturn(null);
        spyOn($rootScope, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN 'should save if questions are answered'
        expect(checklistService.save).toHaveBeenCalled();
    });

    it('given other email address NOT entered when completeAndGenerateChecklist then checklist NOT saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Jurisdiction = "NI";
        $rootScope.Checklist.SiteVisit.VisitDate = new Date("2014-07-26T16:28:57");
        $rootScope.Checklist.Questions = [];
        $rootScope.Checklist.EmailReportToOthers = true;

        spyOn(checklistService, 'save').andReturn(null);
        spyOn($rootScope, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN 
        expect(checklistService.save).not.toHaveBeenCalled();
    });

    it('given other email address entered when completeAndGenerateChecklist then checklist saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Jurisdiction = "NI";
        $rootScope.Checklist.SiteVisit.VisitDate = new Date("2014-07-26T16:28:57");
        $rootScope.Checklist.Questions = [];
        $rootScope.Checklist.EmailReportToOthers = true;

        var otherEmail = createOtherEmail();
        otherEmail.EmailAddress = "test@test.com";

        $rootScope.Checklist.OtherEmails.push(otherEmail);

        spyOn(checklistService, 'save').andReturn(null);
        spyOn($rootScope, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN 
        expect(checklistService.save).toHaveBeenCalled();
    });

    it('given email to person seen selected and email address is null entered when completeAndGenerateChecklist then checklist NOT saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Jurisdiction = "NI";
        $rootScope.Checklist.SiteVisit.VisitDate = new Date("2014-07-26T16:28:57");
        $rootScope.Checklist.Questions = [];
        $rootScope.Checklist.EmailReportToPerson = true;
        $rootScope.Checklist.SiteVisit.EmailAddress = null;

        spyOn(checklistService, 'save').andReturn(null);
        spyOn($rootScope, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN 
        expect(checklistService.save).not.toHaveBeenCalled();
    });

    it('given email to person seen selected and email address is empty string entered when completeAndGenerateChecklist then checklist NOT saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Jurisdiction = "NI";
        $rootScope.Checklist.SiteVisit.VisitDate = new Date("2014-07-26T16:28:57");
        $rootScope.Checklist.Questions = [];
        $rootScope.Checklist.EmailReportToPerson = true;
        $rootScope.Checklist.SiteVisit.EmailAddress = "";

        spyOn(checklistService, 'save').andReturn(null);
        spyOn($rootScope, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN 
        expect(checklistService.save).not.toHaveBeenCalled();
    });

    it('given email to person seen selected and valid email address entered when completeAndGenerateChecklist then checklist saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Jurisdiction = "NI";
        $rootScope.Checklist.SiteVisit.VisitDate = new Date("2014-07-26T16:28:57");
        $rootScope.Checklist.Questions = [];
        $rootScope.Checklist.EmailReportToPerson = true;
        $rootScope.Checklist.SiteVisit.EmailAddress = "test@test.com";

        spyOn(checklistService, 'save').andReturn(null);
        spyOn($rootScope, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN 
        expect(checklistService.save).toHaveBeenCalled();
    });

    it('given email to person seen selected and invalid email address entered when completeAndGenerateChecklist then checklist NOT saved', function () {
        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        $rootScope.Checklist.Jurisdiction = "NI";
        $rootScope.Checklist.SiteVisit.VisitDate = new Date("2014-07-26T16:28:57");
        $rootScope.Checklist.Questions = [];
        $rootScope.Checklist.EmailReportToPerson = true;
        $rootScope.Checklist.SiteVisit.EmailAddress = "tes";

        spyOn(checklistService, 'save').andReturn(null);
        spyOn($rootScope, 'save').andReturn(null);

        //WHEN
        $rootScope.completeAndGenerateChecklist();

        //THEN 
        expect(checklistService.save).not.toHaveBeenCalled();
    });


});

//isValidEmailAddress(emailAddress);