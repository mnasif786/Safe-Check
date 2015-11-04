describe('Account service tests', function () {
    var accountService;
    var $httpBackend;
    var config;
    var windowMock;
    var $rootScope;

    //mock local Storage
    var createLocalStorageMock = function() {
        return MockFactory.createLocalStorageMock();
    };


    beforeEach(function () {
        module('configService');

        module('accountService', function ($provide) {
            windowMock = MockFactory.createWindowMock();

            $provide.value('$window', windowMock);
        });
    });

    beforeEach(inject(function ($injector) {

        accountService = $injector.get("AccountService");
        $httpBackend = $injector.get('$httpBackend');

        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };
    }));

    it('Given offline when get account then service is not called', function () {
        //given
        windowMock.navigator.onLine = false;
        $rootScope.online = false;
        
        var expected = new User('hq', 'john', 'smith');
        expected.role = 'QA';

        windowMock.localStorage.setItem("sc-user", JSON.stringify(expected));

        //when
        var result = null;
        accountService.get(function (data) {
            result = data;
        });

        expect(result.firstname).toBe(expected.firstname);
        expect(result.surname).toBe(expected.surname);
        expect(result.role).toBe(expected.role);
        expect(result.email).toBe(expected.email);
    });

    it('Given online when get account then user account retrieved from server', function () {
        //given
        windowMock.navigator.onLine = true;
        var expected = new User('hq', 'joan', 'smithy', "js1@test.com");
        expected.role = 'Consultant';
        $httpBackend.whenGET("/account").respond(expected);
        $httpBackend.whenGET("api/advisors").respond([]);

        //when
        var result = null;
        var complete = false;
        accountService.get(function (data) {
            result = data;
            complete = true;
        });

        $httpBackend.flush();


        waitsFor(function () {
            return complete;
        }, "get account api call to complete", 500);

        expect(result.firstname).toBe(expected.firstname);
        expect(result.surname).toBe(expected.surname);
        expect(result.role).toBe(expected.role);
        expect(result.email).toBe(expected.email);
    });


    it('Given offline when get advisors then service is not called', function () {
        //given
        windowMock.navigator.onLine = false;
        windowMock.localStorage.setItem('Advisors', JSON.stringify([{ 'one': 1 }, { 'two': 2}]));

        $rootScope.online = false;
        
        //when
        var result = null;
        accountService.getQaAdvisors(function (data) {
            result = data;
        });

        expect(result.length).toBe(2);
    });

    it('Given online when get advisors then service is called', function () {
        //given
        windowMock.navigator.onLine = true;
        windowMock.localStorage.setItem('Advisors', JSON.stringify([{ 'one': 1 }, { 'two': 2}]));
        $httpBackend.whenGET("api/advisors").respond([]);

        //when
        var result = null;
        var complete = false;
        accountService.getQaAdvisors(function (data) {
            result = data;
            complete = true;
        });

        $httpBackend.flush();

        waitsFor(function () {
            return complete;
        }, "get advisors api call to complete", 500);

        expect(result.length).toBe(0);
    });
});