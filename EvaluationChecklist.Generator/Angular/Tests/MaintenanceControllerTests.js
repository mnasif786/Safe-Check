describe('Maintenance Controller tests', function () {

    var $httpBackend;
    var completeSetOfQuestions = null;
    var $rootScope;

    var createQuestion = function(questionText){
        return {
            "Id": guid(),
            "Text": questionText
        };
    }

    var createTemplate = function(templateName){
        return {
            "Id": guid(),
            "Title": templateName,
            "Draft": true,
            "Questions":[]
        };
    }

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
        module('categoryService');
        module('questionService');
        module('industryService');
        module('checklistTemplateService');
        module('consultantService');
    });
    
    beforeEach(inject(function($injector) {
        $httpBackend = $injector.get('$httpBackend');
        //this will log the url called, useful for debugging purposes
        $httpBackend.whenGET(/.*/).respond(function (method, url, data, headers) {
            console.log("URL " + url);
            return [{}];
        });

        completeSetOfQuestions = 
                   [{
                     "Id": "2e50bb04-a611-463d-ba05-0371aa768599",
                     "Text": "Has each pressure system been subject to a written scheme of examination?",
                     "OrderNumber": 4,
                     "Deleted": false,
                     "CategoryId": "19e87828-bc6c-4ba9-b81c-7b225edcdbe2",
                     "Selected": true
                  },
                  {
                      "Id": "d9b5f094-4459-48fe-a89f-13a3b7e568de",
                      "Text": "In petrol filling stations, are suitable safety arrangements in place?",
                      "OrderNumber": 1,
                      "Deleted": false,
                      "CategoryId": "19e87828-bc6c-4ba9-b81c-7b225edcdbe2",
                      "Selected": true
                  },
                  {
                      "Id": "718eb8a9-7d31-40c4-9c6a-1a4fe195c573",
                      "Text": "Is a suitable hazard reporting system actively in place?",
                      "OrderNumber": 3,
                      "Deleted": false,
                      "CategoryId": "19e87828-bc6c-4ba9-b81c-7b225edcdbe2",
                      "Selected": true
                  },
                  {
                      "Id": "b09bf57c-d733-4302-b157-2ed3fb847e8f",
                      "Text": "Is adequate Employers Liability Insurance in place??",
                      "OrderNumber":2,
                      "Deleted": false,
                      "CategoryId": "19e87828-bc6c-4ba9-b81c-7b225edcdbe2",
                      "Selected": true
                  }];
    
        $modalInstance = {
            "close": function () { }
        };

        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };
        


        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');
        createController = function() {
            return $controller('MaintenanceController', { '$scope': $rootScope});
        };
   
    }));

    it("Given and industry template contains questions when i select an industry template then the question checkboxes are checked for the questions in the template ", function () {
        var controller = createController();
        var template = createTemplate("template test");
        template.Questions.push(completeSetOfQuestions[0]);

        $rootScope.questions = completeSetOfQuestions;
        $rootScope.selectedIndustry = template;
        var result = $rootScope.industryChanged();

        expect($rootScope.questions[0].Selected).toEqual(true);
        expect($rootScope.questions[1].Selected).toEqual(false);

    });

    it("Given a question is moved up a position then order numbering of question is correct ", function () {
        var controller = createController();
        var template = createTemplate("template test");
        template.Questions.push(completeSetOfQuestions[0]);

        $rootScope.questions = completeSetOfQuestions;
        $rootScope.selectedIndustry = template;
        var result = $rootScope.MoveQuestionUpOnePosition($rootScope.questions[2]);

        expect($rootScope.questions[0].OrderNumber).toEqual(4);
        expect($rootScope.questions[0].Id).toEqual("2e50bb04-a611-463d-ba05-0371aa768599");
        expect($rootScope.questions[1].OrderNumber).toEqual(1);
        expect($rootScope.questions[1].Id).toEqual("d9b5f094-4459-48fe-a89f-13a3b7e568de");
        expect($rootScope.questions[2].OrderNumber).toEqual(2);
        expect($rootScope.questions[2].Id).toEqual("718eb8a9-7d31-40c4-9c6a-1a4fe195c573");
        expect($rootScope.questions[3].OrderNumber).toEqual(3);
        expect($rootScope.questions[3].Id).toEqual("b09bf57c-d733-4302-b157-2ed3fb847e8f");
    });

    it("Given a question is moved up a position and it is lowest order no. value then question order unchanged ", function () {
        var controller = createController();
        var template = createTemplate("template test");
        template.Questions.push(completeSetOfQuestions[0]);

        $rootScope.questions = completeSetOfQuestions;
        $rootScope.selectedIndustry = template;
        var result = $rootScope.MoveQuestionUpOnePosition($rootScope.questions[1]);

        expect($rootScope.questions[0].OrderNumber).toEqual(4);
        expect($rootScope.questions[0].Id).toEqual("2e50bb04-a611-463d-ba05-0371aa768599");
        expect($rootScope.questions[1].OrderNumber).toEqual(1);
        expect($rootScope.questions[1].Id).toEqual("d9b5f094-4459-48fe-a89f-13a3b7e568de");
        expect($rootScope.questions[2].OrderNumber).toEqual(3);
        expect($rootScope.questions[2].Id).toEqual("718eb8a9-7d31-40c4-9c6a-1a4fe195c573");
        expect($rootScope.questions[3].OrderNumber).toEqual(2);
        expect($rootScope.questions[3].Id).toEqual("b09bf57c-d733-4302-b157-2ed3fb847e8f");
    });

    it("Given a question is moved down a position then order numbering of question is correct ", function () {
        var controller = createController();
        var template = createTemplate("template test");
        template.Questions.push(completeSetOfQuestions[0]);

        $rootScope.questions = completeSetOfQuestions;
        $rootScope.selectedIndustry = template;
        var result = $rootScope.MoveQuestionDownOnePosition($rootScope.questions[1]);

        expect($rootScope.questions[0].OrderNumber).toEqual(4);
        expect($rootScope.questions[0].Id).toEqual("2e50bb04-a611-463d-ba05-0371aa768599");
        expect($rootScope.questions[1].OrderNumber).toEqual(2);
        expect($rootScope.questions[1].Id).toEqual("d9b5f094-4459-48fe-a89f-13a3b7e568de");
        expect($rootScope.questions[2].OrderNumber).toEqual(3);
        expect($rootScope.questions[2].Id).toEqual("718eb8a9-7d31-40c4-9c6a-1a4fe195c573");
        expect($rootScope.questions[3].OrderNumber).toEqual(1);
        expect($rootScope.questions[3].Id).toEqual("b09bf57c-d733-4302-b157-2ed3fb847e8f");
    });

    it("Given a question is moved down a position and it already has highest order no then order is unchanged ", function () {
        var controller = createController();
        var template = createTemplate("template test");
        template.Questions.push(completeSetOfQuestions[0]);

        $rootScope.questions = completeSetOfQuestions;
        $rootScope.selectedIndustry = template;
        var result = $rootScope.MoveQuestionDownOnePosition($rootScope.questions[0]);

        expect($rootScope.questions[0].OrderNumber).toEqual(4);
        expect($rootScope.questions[0].Id).toEqual("2e50bb04-a611-463d-ba05-0371aa768599");
        expect($rootScope.questions[1].OrderNumber).toEqual(1);
        expect($rootScope.questions[1].Id).toEqual("d9b5f094-4459-48fe-a89f-13a3b7e568de");
        expect($rootScope.questions[2].OrderNumber).toEqual(3);
        expect($rootScope.questions[2].Id).toEqual("718eb8a9-7d31-40c4-9c6a-1a4fe195c573");
        expect($rootScope.questions[3].OrderNumber).toEqual(2);
        expect($rootScope.questions[3].Id).toEqual("b09bf57c-d733-4302-b157-2ed3fb847e8f");
    });
});