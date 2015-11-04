describe('Checklist service save', function () {

    var checklistService;
    var $httpBackend;
    var $modal;
    var config;
    var windowMock;
    var $rootScope;
    var $timeout;

    //mock local Storage
    var createLocalStorageMock = function() {
        return MockFactory.createLocalStorageMock();
    };

  var createChecklist = function () {
        return {
            "Id": guid(),
            "Status": 'Draft',
            "ClientId": 33749,
            "SiteId": null,
            "Categories": [],
            "Questions": [],
            "SiteVisit": { "SelectedImpressionType": null, "VisitDate": null },
            "CreatedOn": null,
            "CreatedBy": null,
            "LastModifiedOn" : new Date('2013-11-25T10:18:44')
        };
    };
    
    beforeEach(function () {
        module('clientemployeeService');
        module('clientQuestionService');
        module('configService');
        module('ui.bootstrap.modal');
        module('clientServiceREST');
        module('checklistTemplateService');
        
        module('checklistService', function ($provide) {
            windowMock = MockFactory.createWindowMock();

            $provide.value('$window', windowMock);
            $provide.value('$modal', {}); //mock the modal because it calls methods of the windowMock that aren't defined
        });
    });


    beforeEach(inject(function ($injector) {
        $rootScope = $injector.get('$rootScope');
        $modal = $injector.get('$modal');
        $httpBackend = $injector.get('$httpBackend');
        $timeout = $injector.get('$timeout');

        var configService = $injector.get('ConfigService');
        config = configService.getConfig();
        checklistService = $injector.get("ChecklistService");

        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('given a draft checklist and offline when save then checklist saved to localstorage', function () {
        //WHEN
        windowMock.navigator.onLine = false;
        $rootScope.online = false;
        
        var checklist = createChecklist();
        checklist.Status = "Draft";

        var complete = false;
        var result = null;

        //WHEN
        checklistService.save(checklist)
            .then(function (saveResult) {
                result = saveResult;
                complete = true;
            });

        $timeout.flush();

       // $rootScope.$apply();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        //THEN
        expect(result.success).toBe(true);
        expect(windowMock.localStorage.getItem("Checklist." + checklist.Id)).not.toBe(null);
        
    });

    it('given a completed checklist we are online when save then checklist successfully saved to server and removed from local storage', function () {
        //WHEN
        var checklist = createChecklist();
        checklist.Status = "Completed";

        windowMock.localStorage.setItem("Checklist." + checklist.Id, JSON.stringify(checklist));
        windowMock.navigator.onLine = true;
        
        $httpBackend.whenPOST('api/checklists/' + checklist.Id).respond({ "LastModifiedOn": new Date('2013-11-25T10:18:44')});

        var complete = false;
        var result = null;

        //WHEN
        var promise = checklistService.save(checklist);

        promise.then(function (saveResult) {
            result = saveResult;
            complete = true;
        });

        $httpBackend.flush();
        $rootScope.$apply();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        //THEN
        expect(result.success).toBe(true);
        expect(windowMock.localStorage.getItem("Checklist." + checklist.Id)).toBe(null);

    });

    it('given a completed checklist when save and checklist successfully saved to server then checklist removed from local storage', function () {
        //WHEN
        var checklist = createChecklist();
        checklist.Status = "Completed";

        windowMock.localStorage.setItem("Checklist." + checklist.Id, JSON.stringify(checklist));
        windowMock.navigator.onLine = true;

        $httpBackend.whenPOST('api/checklists/' + checklist.Id).respond({ "LastModifiedOn": new Date('2013-11-25T10:18:44') });

        var complete = false;
        var result = null;

        //WHEN
        var promise = checklistService.save(checklist);

        promise.then(function (saveResult) {
            result = saveResult;
            complete = true;
        });

        $httpBackend.flush();
       // $rootScope.$apply();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        //THEN
        expect(result.success).toBe(true);
        expect(windowMock.localStorage.getItem("Checklist." + checklist.Id)).toBe(null);

    });

    xit('given a completed checklist when save is unsuccessfully saved to server then checklist saved to local storage', function () {
        //WHEN
        var checklist = createChecklist();
        checklist.Status = "Completed";
        windowMock.navigator.onLine = true;

        $httpBackend.whenPOST('api/checklists/' + checklist.Id).respond(500,'');

        var complete = false;
        var result = null;

        //WHEN
        var promise = checklistService.save(checklist);

        promise.then(function (saveResult) {
            result = saveResult;
            complete = true;
        });

        $httpBackend.flush();
        $rootScope.$apply();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        //THEN
        expect(result.success).toBe(false);
        expect(windowMock.localStorage.getItem("Checklist." + checklist.Id)).not.toBe(null);

    });

    it('given a completed checklist when save and checklist successfully saved to server then client employees removed from local storage', function () {
        //WHEN
        var checklist = createChecklist();
        checklist.Status = "Completed";

        windowMock.localStorage.setItem("Checklist." + checklist.Id, JSON.stringify(checklist));
        windowMock.localStorage.setItem("Employees:" + checklist.ClientId, JSON.stringify([{"Id": 1}]));
        windowMock.navigator.onLine = true;

        $httpBackend.whenPOST('api/checklists/' + checklist.Id).respond({ "LastModifiedOn": new Date('2013-11-25T10:18:44') });

        var complete = false;
        var result = null;

        //WHEN
       checklistService.save(checklist)
            .then(function (saveResult) {
                result = saveResult;
                complete = true;
            });

        $httpBackend.flush();
       // $rootScope.$apply();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        //THEN
        expect(result.success).toBe(true);
        expect(windowMock.localStorage.getItem("Employees:" + checklist.ClientId)).toBe(null);

    });

   

   

   
});