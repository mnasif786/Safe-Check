describe('Checklist service query', function () {

    var checklistService;
    var $httpBackend;
    var $modal;
    var config;
    var windowMock;
    var $rootScope;

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
            "CreatedBy": null
        };
    };


    beforeEach(function () {
        module('configService');
        module('ui.bootstrap.modal');
        module('clientServiceREST');
        module('clientemployeeService');
        module('clientQuestionService');

        module(function ($provide) {
            windowMock = MockFactory.createWindowMock();

            $provide.value('$window', windowMock);
            $provide.value('$modal', {}); //mock the modal because it calls methods of the windowMock that aren't defined
        });

        module('checklistTemplateService');
        module('checklistService');
    });


    beforeEach(inject(function ($injector) {
        $modal = $injector.get('$modal');
        $httpBackend = $injector.get('$httpBackend');

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

    it('given offline then return locally stored checklists', function () {
        windowMock.navigator.onLine = false;
        windowMock.localStorage.setItem("Checklist.1111", JSON.stringify(createChecklist()));
        windowMock.localStorage.setItem("Checklist.2222", JSON.stringify(createChecklist()));

        $rootScope.online = false;
        
        var complete = false;
        var result = null;
        checklistService.query('', '', null, 'Draft', false, null, "", "", function (data) {
            result = data;
            complete = true;
        });


        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        expect(result).toBeDefined();
        expect(result.length).toBe(2);

    });

    it('given online then return server and locally stored checklists', function () {

        var serverChecklist = [];
        serverChecklist.push(createChecklist());
        serverChecklist.push(createChecklist());

        $httpBackend.whenGET(config.apiUrl + 'checklistsquery?clientAccountNumber=&checklistCreatedBy=&visitDate=null&status=Draft&includeDeleted=false&excludeSubmitted=null&statusFromDate=&statusToDate=').respond(serverChecklist);

        windowMock.navigator.onLine = true;
        windowMock.localStorage.setItem("Checklist.1111", JSON.stringify(createChecklist()));
        windowMock.localStorage.setItem("Checklist.2222", JSON.stringify(createChecklist()));

        var complete = false;
        var result = null;
        checklistService.query('', '', null, 'Draft', false, null, "", "", function (data) {
            result = data;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        expect(result).toBeDefined();
        expect(result.length).toBe(4);

    });

    it('given online when get checklist then service is called', function () {
        //given
        windowMock.navigator.onLine = true;
        var id = guid();
        var clientId = 1234;
        $httpBackend.whenGET('api/checklists/' + id).respond({ 'Id': id, 'ClientId': clientId, "IndustryId": 1111, 'Status': 'Draft' });
        $httpBackend.whenGET('api/clients/' + clientId).respond(null);
        $httpBackend.whenGET('api/clients/' + clientId + '/employees').respond(null);
        $httpBackend.whenGET('api/completesetofquestions').respond([{ "Id": 1 }, { "Id": 2}]);
        $httpBackend.whenGET('api/checklisttemplate/1111').respond([{ "Id": 1 }, { "Id": 2}]);
        $httpBackend.whenGET('api/template/1111/name').respond(JSON.stringify("test"));

        //when
        var complete = false;
        var result = null;

        checklistService.get(id, function (data) {
            result = data;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        expect(result.ClientId).toBe(clientId);
        expect(result.Id).toBe(id);

    });

    it('given offline when get checklist then service is not called and checklist retrieved from local storage', function () {
        //given
        windowMock.navigator.onLine = false;
        $rootScope.online = false;
        
        var id = guid();
        var clientId = 1234;

        windowMock.localStorage.setItem('Checklist.' + id, JSON.stringify({ 'Id': id, 'ClientId': clientId }));

        //when
        var complete = false;
        var result = null;

        checklistService.get(id, function (data) {
            result = data;
            complete = true;
        });

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        expect(result.ClientId).toBe(clientId);
        expect(result.Id).toBe(id);

    });

    it('given online and checklist status is Draft when get checklist is called then client employees and completed set of questions stored locally', function () {
        //given
        windowMock.navigator.onLine = true;
        
        var id = guid();
        var clientId = 1234;
        $httpBackend.whenGET('api/checklists/' + id).respond({ 'Id': id, 'ClientId': clientId, "Status": "Draft", "IndustryId": 1111 });
        $httpBackend.whenGET('api/clients/' + clientId).respond(null);
        $httpBackend.whenGET('api/clients/' + clientId + "/employees").respond([{ "Id": 1 }, { "Id": 2}]);
        $httpBackend.whenGET('api/completesetofquestions').respond([{ "Id": 1 }, { "Id": 2}]);
        $httpBackend.whenGET('api/checklisttemplate/1111').respond([{ "Id": 1 }, { "Id": 2}]);
        $httpBackend.whenGET('api/template/1111/name').respond(JSON.stringify("test"));

        //when
        var complete = false;
        var result = null;

        checklistService.get(id, function (data) {
            result = data;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        expect(windowMock.localStorage.getItem("Employees:" + clientId)).not.toBe(null);
        expect(JSON.parse(windowMock.localStorage.getItem("Employees:" + clientId))).not.toBe(null);
        expect(windowMock.localStorage.getItem("CompleteSetOfQuestions")).not.toBe(null);
        expect(JSON.parse(windowMock.localStorage.getItem("CompleteSetOfQuestions"))).not.toBe(null);
    });

    it('given online and checklist status is Completed when get checklist is called then client employees and completed set of questions NOT stored locally', function () {
        //given
        windowMock.navigator.onLine = true;
        var id = guid();
        var clientId = 1234;
        $httpBackend.whenGET('api/checklists/' + id).respond({ 'Id': id, 'ClientId': clientId, "Status": "Completed", "IndustryId": 1111 });
        $httpBackend.whenGET('api/clients/' + clientId).respond(null);
        $httpBackend.whenGET('api/clients/' + clientId + "/employees").respond([{ "Id": 1 }, { "Id": 2}]);
        $httpBackend.whenGET('api/completesetofquestions').respond([{ "Id": 1 }, { "Id": 2}]);
        $httpBackend.whenGET('api/checklisttemplate/1111').respond([{ "Id": 1 }, { "Id": 2}]);
        $httpBackend.whenGET('api/template/1111/name').respond(JSON.stringify("test"));

        //when
        var complete = false;
        var result = null;

        checklistService.get(id, function (data) {
            result = data;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "checklist api call to complete", 500);

        expect(windowMock.localStorage.getItem("Employees." + clientId)).toBe(null);
        expect(windowMock.localStorage.getItem("CompleteSetOfQuestions")).toBe(null);
    });

});