describe('Client search controller tests', function () {

    var $httpBackend, $routeParameters;
    var config;

    beforeEach(function () {
        module('evaluationchecklistModule');

    });

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        var configService = $injector.get('ConfigService');
        config = configService.getConfig();

        $httpBackend.whenGET(/.*\/api\/clients.*/i).respond({});

        //this will log the url called, useful for debugging purposes
//        $httpBackend.whenGET(/.*\/api\/clients.*/i).respond(function (method, url, data, headers) {
//            console.log("URL " + url);
//            return [{}];
//        });

        $routeParameters = $injector.get("$routeParams");

        // Get hold of a scope (i.e. the root scope)
        $rootScope = $injector.get('$rootScope');

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');


        createController = function () {
            return $controller('ClientSearchController', { '$scope': $rootScope });
        };

    }));

//    it('Given a client account number is specified in the route then correct api url is called', function () {
//        //GIVEN
//        var clientAccountNumber = "DEMO";
//        $routeParameters.clientAccountNumber = clientAccountNumber;
//        $httpBackend.expectGET(config.apiUrl + "clients/query/" + clientAccountNumber);

//        //WHEN
//        var controller = createController();
//        //explicitly flush pending requests and thus preserving the async api of the backend, while allowing the test to execute synchronously.
//        $httpBackend.flush();
//        $httpBackend.verifyNoOutstandingExpectation();
//    });



});
