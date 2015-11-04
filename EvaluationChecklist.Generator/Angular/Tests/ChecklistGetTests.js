describe('Checklist service get checklist', function () {

    var checklistService;
    var $httpBackend;
    var $modal;
    var config;
    var windowMock = MockFactory.createWindowMock();
    var $rootScope;
    var $timeout;

    //mock local Storage
    var createLocalStorageMock = function() {
        return MockFactory.createLocalStorageMock();
    };

    var fakeModal = {
        then: function (callback) {
            callback(fakeModal);
        }
          ,
        result: {
            then: function (callback) {
                callback({});
            }
        }
    };

    var fakeModalFactory = {
        open: function (options) {
            console.log('opened in fake modal');
            return fakeModal;
        }
    };



    var createChecklist = function () {
        return SafecheckObjectFactory.createChecklist();
    };

    var createClientDetails = function() {
        return SafecheckObjectFactory.createClientDetails();
    };

    beforeEach(function () {
        module('clientemployeeService');
        module('clientQuestionService');
        module('configService');
        module('clientServiceREST');
        module('checklistTemplateService');

        module('checklistService', function ($provide) {

            windowMock = MockFactory.createWindowMock();

            $provide.value('$window', windowMock);
            $provide.value('$modal', fakeModalFactory);
        }); //mock the modal because it calls methods of the windowMock that aren't defined

    });


    beforeEach(inject(function ($injector) {
        $rootScope = $injector.get('$rootScope');
        $modal = $injector.get('$modal');
        $httpBackend = $injector.get('$httpBackend');
        $timeout = $injector.get('$timeout');

        var configService = $injector.get('ConfigService');
        config = configService.getConfig();
        checklistService = $injector.get("ChecklistService");

        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };


    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('given a checklist is not in localstorage when get then checklist retrieved from server', function () {
        //WHEN
        var expectedChecklist = createChecklist();
        expectedChecklist.Status = "Draft";
        expectedChecklist.SiteId = 432845;

        $httpBackend.whenGET('api/checklists/' + expectedChecklist.Id).respond(JSON.stringify(expectedChecklist));
        $httpBackend.whenGET('api/clients/' + expectedChecklist.ClientId).respond(createClientDetails());
        $httpBackend.whenGET('api/clients/' + expectedChecklist.ClientId + '/employees').respond([{}]);
        $httpBackend.whenGET('api/completesetofquestions').respond([{}]);

        var complete = false;
        var result = null;

        //WHEN
        checklistService.getFromServer(expectedChecklist.Id, false, function (checklistData) {
            result = checklistData;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        //THEN
        expect(result.success).toBe(true);
        expect(result.checklist.Id).toBe(expectedChecklist.Id);
        expect(result.checklist.CreatedBy).toBe(expectedChecklist.CreatedBy);
        expect(result.checklist.Site).not.toBe(null);

    });


    it('given checklist in localstorage is newer than server version when get then local checklist is returned', function () {
        //WHEN
        var serverChecklist = createChecklist();
        serverChecklist.Status = "Draft";
        serverChecklist.LastModifiedOn = new Date(2014, 0, 28);

        var localChecklist = createChecklist();
        localChecklist.Id = serverChecklist.Id;
        localChecklist.Status = "Draft";
        localChecklist.LastModifiedOn = new Date(2014, 0, 29);

        windowMock.localStorage.setItem("Checklist." + localChecklist.Id, JSON.stringify(localChecklist));

        $httpBackend.whenGET('api/checklists/' + serverChecklist.Id).respond(JSON.stringify(serverChecklist));
        $httpBackend.whenGET('api/clients/' + serverChecklist.ClientId).respond({});
        $httpBackend.whenGET('api/clients/' + serverChecklist.ClientId + '/employees').respond([{}]);
        $httpBackend.whenGET('api/completesetofquestions').respond([{}]);

        $httpBackend.whenGET('api/checklist/' + serverChecklist.Id + '/getlastmodifiedon').respond(JSON.stringify(serverChecklist.LastModifiedOn));

        var complete = false;
        var result = null;

        //WHEN
        checklistService.getFromServer(serverChecklist.Id, false, function (checklistData) {
            result = checklistData;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        //THEN
        expect(result.success).toBe(true);
        expect(result.checklist.Id).toBe(localChecklist.Id);
        expect(result.checklist.LastModifiedOn.toJSON()).toBe(localChecklist.LastModifiedOn.toJSON());

    });

    it('given checklist in localstorage is older than server version when get then prompt', function () {
        //WHEN
        var serverChecklist = createChecklist();
        serverChecklist.Status = "Draft";
        serverChecklist.LastModifiedOn = new Date(2014, 0, 29);
        serverChecklist.Deleted = false;

        var localChecklist = createChecklist();
        localChecklist.Id = serverChecklist.Id;
        localChecklist.Status = "Draft";
        localChecklist.LastModifiedOn = new Date(2014, 0, 28);

        windowMock.localStorage.setItem("Checklist." + localChecklist.Id, JSON.stringify(localChecklist));

        $httpBackend.whenGET('api/checklists/' + serverChecklist.Id).respond(JSON.stringify(serverChecklist));
        $httpBackend.whenGET('api/clients/' + serverChecklist.ClientId).respond({});
        $httpBackend.whenGET('api/clients/' + serverChecklist.ClientId + '/employees').respond([{}]);
        $httpBackend.whenGET('api/completesetofquestions').respond([{}]);
        $httpBackend.whenGET('api/checklist/' + serverChecklist.Id + '/getlastmodifiedon').respond(JSON.stringify(serverChecklist.LastModifiedOn));

        var complete = false;
        var result = null;

        spyOn(fakeModalFactory, "open").andReturn(fakeModal);

        //WHEN
        checklistService.getFromServer(serverChecklist.Id, false, function (checklistData) {
            result = checklistData;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        //THEN
        expect(fakeModalFactory.open).toHaveBeenCalled();

    });

    it('given i have a draft checklist saved to localStorage when getDraftsFromLocalStorage then checklist is retrieved', function () {

        var checklist = createChecklist();
        checklist.Status = "Draft";

        //save to local storage
        checklistService.saveToLocalStorage(checklist);

        var result = checklistService.getDraftsFromLocalStorage();


        //assert that only the question id exists in the object returned from local storage
        expect(result.length).toEqual(1);
        expect(result[0].Id).toEqual(checklist.Id);
        expect(result[0].Status).toEqual('Draft');

    });
});