describe('Response details tests', function () {
    var $routeParameters;
    var $rootScope;

    var $questionAnswer;

    beforeEach(function () {
        module('clientemployeeService');

    });

    beforeEach(inject(function ($injector) {

        $routeParameters = $injector.get("$routeParams");

        $modalInstance = {
            "close": function () { },
            "dismiss": function () { }
        };

        // Get hold of a scope (i.e. the root scope)
        $rootScope = $injector.get('$rootScope');

        var checklist = {
            "ClientId": ""
        };

        $rootScope.$parent = {
            "Checklist": checklist
        };

        $rootScope.user = {
            "role": ""
        };
        

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');

        var assignedTo = {
            "Id": "00000000-0000-0000-0000-000000000000",
            "FullName": "-- Not Listed --",
            "NonEmployeeName": null
        };

        var answer =
        {
            "AssignedTo": assignedTo,
            "Response": {
                "Title": ""
            }
        };

        $questionAnswer =
        {
            "Answer": answer
        };

        $nonEmployees = [];

        var clientemployeeService = {

            get: function () {
            }

        };

        var $clientId = "12345678-1234-1234-1234-000000000000";

        var $areQACommentsEnabled = {

            areQACommentsEnabled: function () {
            }

        };

        createController = function () {
            return $controller('ResponseController', {
                '$scope': $rootScope,
                "$modalInstance": $modalInstance,
                "ClientEmployeeService": clientemployeeService,
                "questionAnswer": $questionAnswer,
                "nonEmployees": $nonEmployees,
                "clientId": $clientId,
                "areQACommentsEnabled": $areQACommentsEnabled
            });
        };


    }));

    var createQuestionAnswer = function () {
        return {
            "Question": { "Text": "questiontext", "Mandatory": false, "CustomQuestion": false },
            "Answer": {
                "SelectedResponseId": "2ac99e50-5f04-488b-8c10-fb7ff2ed51b3",
                "SupportingEvidence": "",
                "ActionRequired": "All lifting equipment should be subject to examination and servicing.",
                "GuidanceNotes": "4.17",
                "Timescale": null,
                "AssignedTo": null,
                "QuestionId": "07a483ee-da8a-433d-8283-a45b899f37bf",
                "QaComments": null,
                "QaSignedOffBy": null,
                "ReportLetterStatement": "No Thorough Examination and servicing of lifting equipment",
                "QaCommentsResolved": null,
                "QaSignedOffDate": null,
                "AreaOfNonCompliance": null,
                "Response": { "Title": null }
            }
        };
    }


    it('given that a client employee has been selected then Not Listed text box should be hidden', function () {
        //GIVEN        
        $questionAnswer.Answer.AssignedTo.Id = guid();


        //WHEN
        var controller = createController();

        // THEN
        expect($rootScope.isEmployeeNotListed()).toBe(false);
    });

    it('given that no employee name has been selected then Not Listed text box should be hidden', function () {
        //GIVEN        
        $questionAnswer.Answer.AssignedTo = null;

        //WHEN
        var controller = createController();

        // THEN
        expect($rootScope.isEmployeeNotListed()).toBe(false);
    });

    it('given that NonEmployee name has been selected then Not Listed text box should not be hidden', function () {
        //GIVEN        
        $questionAnswer.Answer.AssignedTo.Id = "00000000-0000-0000-0000-000000000000";
        $questionAnswer.Answer.AssignedTo.NonEmployeeName = "Fred Flintstone";

        //WHEN
        var controller = createController();

        // THEN
        expect($rootScope.isEmployeeNotListed()).toBe(true);
    });

    it('given a bespoke question then question text is editable', function () {
        //GIVEN        
        var questionAnswer = createQuestionAnswer();
        questionAnswer.Question.Mandatory = false;
        questionAnswer.Question.CustomQuestion = true;

        //WHEN
        var controller = createController();

        // THEN
        expect($rootScope.isQuestionTextEditable(questionAnswer)).toBe(true);


    });

    it('given a mandatory question then question text is NOT editable', function () {
        //GIVEN        
        var questionAnswer = createQuestionAnswer();
        questionAnswer.Question.Mandatory = true;
        questionAnswer.Question.CustomQuestion = true;

        //WHEN
        var controller = createController();

        // THEN
        expect($rootScope.isQuestionTextEditable(questionAnswer)).toBe(false);
    });

    it('given a non-mandatory question then question text is NOT editable', function () {
        //GIVEN        
        var questionAnswer = createQuestionAnswer();
        questionAnswer.Question.Mandatory = false;
        questionAnswer.Question.CustomQuestion = false;

        //WHEN
        var controller = createController();

        // THEN
        expect($rootScope.isQuestionTextEditable(questionAnswer)).toBe(false);
    });

    it('given acceptable response and Verified documentation selected when isSupportDocumentationDateVisible then returns true', function () {
        //GIVEN
        var questionAnswer = createQuestionAnswer();
        questionAnswer.Answer.SupportingDocumentationStatus = "Verified";
        questionAnswer.Answer.Response.Title = "Acceptable";

        var controller = createController();

        //WHEN
        var result = $rootScope.isSupportDocumentationDateVisible(questionAnswer);

        //THEN
        expect(result).toBe(true);

    });

    it('given not an acceptable response and Verified documentation selected when isSupportDocumentationDateVisible then returns true', function () {
        //GIVEN
        var questionAnswer = createQuestionAnswer();
        questionAnswer.Answer.SupportingDocumentationStatus = "Verified";
        questionAnswer.Answer.Response.Title = "Improvement Required";

        var controller = createController();

        //WHEN
        var result = $rootScope.isSupportDocumentationDateVisible(questionAnswer);

        //THEN
        expect(result).toBe(false);

    });

    it('given acceptable response and documentation selected is NA when ok modal then supportingDocumentationDate is set to null', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.SupportingDocumentationStatus = "";
        $questionAnswer.Answer.SupportingDocumentationDate = new Date(2011, 12, 05);
        $questionAnswer.Answer.Response.Title = "Acceptable";

        var controller = createController();

        //WHEN
        $rootScope.ok();

        //THEN
        expect($questionAnswer.Answer.SupportingDocumentationDate).toBe(null);

    });

//    it('given Unacceptable response has no assignedTo and no timescale then validation is false', function () {
//        //GIVEN
//        $questionAnswer = createQuestionAnswer();
//        $questionAnswer.Answer.Response.Title = "Unacceptable";
//        $questionAnswer.Answer.AssignedTo = null;
//        $questionAnswer.Answer.Timescale = null;

//        var controller = createController();

//        //WHEN
//        var result = $rootScope.validateResponse();

//        //THEN
//        expect(result).toBe(false);

//    });

    it('given Unacceptable response has no assignedTo and no timescale and user has QA role then validation is true', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Unacceptable";
        $questionAnswer.Answer.AssignedTo = null;
        $questionAnswer.Answer.Timescale = null;

        $rootScope.user.role = 'QA';

        var controller = createController();

        //WHEN
        var result = $rootScope.validateResponse();

        //THEN
        expect(result).toBe(true);

    });

    it('given Improvement Required response has no assignedTo and no timescale and user has QA role then validation is true', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Improvement Required";
        $questionAnswer.Answer.AssignedTo = null;
        $questionAnswer.Answer.Timescale = null;

        $rootScope.user.role = 'QA';
        
        var controller = createController();

        //WHEN
        var result = $rootScope.validateResponse();

        //THEN
        expect(result).toBe(true);

    });
    
//    it('given Unacceptable response has notListed assignedTo and notListed value is not provided then validation is false', function () {
//        //GIVEN
//        $questionAnswer = createQuestionAnswer();
//        $questionAnswer.Answer.Response.Title = "Unacceptable";
//        $questionAnswer.Answer.AssignedTo = '--Not Listed--';
//        $questionAnswer.Answer.AssignedTo.NonEmployeeName = '';

//        var controller = createController();

//        //WHEN
//        var result = $rootScope.validateResponse();

//        //THEN
//        expect(result).toBe(false);

//    });

//    it('given Improvement Required response has no assignedTo and no timescale then validation is false', function () {
//        //GIVEN
//        $questionAnswer = createQuestionAnswer();
//        $questionAnswer.Answer.Response.Title = "Improvement Required";
//        $questionAnswer.Answer.AssignedTo = null;
//        $questionAnswer.Answer.Timescale = null;

//        var controller = createController();

//        //WHEN
//        var result = $rootScope.validateResponse();

//        //THEN
//        expect(result).toBe(false);
//    });

//    it('given Improvement Required response has notListed assignedTo and notListed value is not provided then validation is false', function () {
//        //GIVEN
//        $questionAnswer = createQuestionAnswer();
//        $questionAnswer.Answer.Response.Title = "Improvement Required";
//        $questionAnswer.Answer.AssignedTo = '--Not Listed--';
//        $questionAnswer.Answer.AssignedTo.NonEmployeeName = '';

//        var controller = createController();

//        //WHEN
//        var result = $rootScope.validateResponse();

//        //THEN
//        expect(result).toBe(false);
//    });


    it('given Acceptable response has no assignedTo and no timescale then validation is true', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Acceptable";
        $questionAnswer.Answer.AssignedTo = null;
        $questionAnswer.Answer.Timescale = null;

        var controller = createController();

        //WHEN
        var result = $rootScope.validateResponse();

        //THEN
        expect(result).toBe(true);
    });

    it('given Acceptable Required response has notListed assignedTo and notListed value is not provided then validation is true', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Acceptable";
        $questionAnswer.Answer.AssignedTo = '--Not Listed--';
        $questionAnswer.Answer.AssignedTo.NonEmployeeName = '';

        var controller = createController();

        //WHEN
        var result = $rootScope.validateResponse();

        //THEN
        expect(result).toBe(true);
    });
    it('given Not Applicable response has no assignedTo and no timescale then validation is true', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Not Applicable";
        $questionAnswer.Answer.AssignedTo = null;
        $questionAnswer.Answer.Timescale = null;

        var controller = createController();

        //WHEN
        var result = $rootScope.validateResponse();

        //THEN
        expect(result).toBe(true);
    });

    it('given Not Applicable Required response has notListed assignedTo and notListed value is not provided then validation is true', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Not Applicable";
        $questionAnswer.Answer.AssignedTo = '--Not Listed--';
        $questionAnswer.Answer.AssignedTo.NonEmployeeName = '';

        var controller = createController();

        //WHEN
        var result = $rootScope.validateResponse();

        //THEN
        expect(result).toBe(true);
    });


    it('given Unacceptable response has when isNegativeResponse then result returns true', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Unacceptable";

        var controller = createController();

        //WHEN
        var result = $rootScope.isNegativeResponse($questionAnswer.Answer.Response);

        //THEN
        expect(result).toBe(true);
    });

    it('given Improvement Required response has when isNegativeResponse then result returns true', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Improvement Required";

        var controller = createController();

        //WHEN
        var result = $rootScope.isNegativeResponse($questionAnswer.Answer.Response);

        //THEN
        expect(result).toBe(true);
    })

    it('given Acceptable response has when isNegativeResponse then result returns false', function () {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Acceptable";

        var controller = createController();

        //WHEN
        var result = $rootScope.isNegativeResponse($questionAnswer.Answer.Response);

        //THEN
        expect(result).toBe(false);
    })

    it('given Not Applicable Required response has when isNegativeResponse then result returns false', function() {
        //GIVEN
        $questionAnswer = createQuestionAnswer();
        $questionAnswer.Answer.Response.Title = "Not Applicable";

        var controller = createController();

        //WHEN
        var result = $rootScope.isNegativeResponse($questionAnswer.Answer.Response);

        //THEN
        expect(result).toBe(false);
    });


});
