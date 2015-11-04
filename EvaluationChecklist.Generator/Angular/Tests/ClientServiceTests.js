describe('Client details service', function () {

    var clientService;
    var $httpBackend;
    var config;

    beforeEach(function () {
        module('ngResource');
        module('clientServiceREST');
        module('configService');
    });

    beforeEach(inject(function ($injector) {

        clientService = $injector.get("ClientServiceREST");
        $httpBackend = $injector.get('$httpBackend');
        var configService = $injector.get('ConfigService');
        config = configService.getConfig();

        //this will log the url called, useful for debugging purposes
        $httpBackend.whenGET(/.*/).respond(function (method, url, data, headers) {
            console.log("URL " + url);
            return [{}];
        });

    }));

    it('Given i query a client by client account number then the correct api url is called', function () {
       

        //GIVEN
        var clientAccountNumber = "DEMO888";

        $httpBackend.expectGET(config.apiUrl + 'clients/query/' + clientAccountNumber).respond({});

        //WHEN
        var result = clientService.query(clientAccountNumber, function () { });

        //THEN
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();

    });

    it('Given i get a client by id then the correct api url is called', function () {
        //GIVEN
        var clientId = 256236346;

        $httpBackend.expectGET(config.apiUrl + 'clients/' + clientId).respond({});

        //WHEN
        var result = clientService.get(clientId, function () { });

        //THEN
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();

    });


});
