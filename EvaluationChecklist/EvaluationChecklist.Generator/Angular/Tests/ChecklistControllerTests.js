describe('Checklist controller tests', function () {

    var $httpBackend, $rootScope, $modal, createController, config, impressionTypeService, checklistService, $window, questionService;

    var checklistId = 'aaaaaaaa-f940-4674-aeb5-7be0409e9999';

    var createChecklist = function() {
        return SafecheckObjectFactory.createChecklist();
    };

    var createEmployee = function () {
        return SafecheckObjectFactory.createEmployee();
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

    it('checklist api was called with the correct parameters', function () {
        localStorage.removeItem("Checklist." + checklistId);
        var controller = createController();

        $httpBackend.expectGET(config.apiUrl + '/checklists/' + checklistId);
        $httpBackend.expectGET(config.apiUrl + 'impressions');
    });

    it('Given i have a checklist when save the client id is set', function () {
        localStorage.removeItem("Checklist." + checklistId);

        $httpBackend.expectPOST(config.apiUrl + 'checklists/' + checklistId).respond({});

        var clientId = 124312478;
        var controller = createController();
        $rootScope.Checklist = {
            "Id": checklistId,
            "ClientId": 0,
            "ClientDetails": {
                "Id": clientId,
                "CompanyName": "The Dental Practice",
                "CAN": "DEN101"
            },
            "SiteVisit": { "SelectedImpressionType": null },
            "Questions": []
        };
        $rootScope.save();

        expect($rootScope.Checklist.ClientId).toEqual(clientId);
    });

    it('Given i have a checklist when save then save service is called', function () {

        //givem
        localStorage.removeItem("Checklist." + checklistId);
        spyOn(checklistService, "save");
        var clientId = 124312478;
        var controller = createController();

        $rootScope.IsDirty = true;

        $rootScope.Checklist = {
            "Id": checklistId,
            "ClientId": 0,
            "ClientDetails": {
                "Id": clientId,
                "CompanyName": "The Dental Practice",
                "CAN": "DEN101"
            },
            "SiteVisit": { "SelectedImpressionType": null },
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "PossibleResponses": [
                        ]
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "SupportingEvidence": "",
                        "ActionRequired": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    }
                }
            ]
        };



        //when
        $rootScope.save();
        //then
        waitsFor('the save checklist queue to be saved', function () {
            if (checklistService.save.calls.length > 0) {
                expect(checklistService.save).toHaveBeenCalled();
                return true;
            }

        }, 500);

    });

    it('Given i have a checklist when submit to server then HTTP Post to /api/checklists/ is called', function () {
        $httpBackend.expectPOST(config.apiUrl + 'checklists/' + checklistId).respond({
            "Id": checklistId,
            "SiteVisit": { "SelectedImpressionType": null }
        });

        var controller = createController();
        $rootScope.Checklist = {
            "Id": checklistId,
            "ClientId": 0,
            "ClientDetails": {
                "Id": 13123,
                "CompanyName": "The Dental Practice1",
                "CAN": "DEN101"
            },
            "SiteVisit": { "SelectedImpressionType": null },
            "Questions": []
        };

        $rootScope.doReviewAndSubmit();
        setTimeout(function () {
            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
        }, 300);


    });

    it('Given i have answered a question then i want the comment to be updated with the default text method', function () {

        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        var questionId = $rootScope.Checklist.Questions[0].Question.Id;
        var expectedComment = "i want to see this comment";


        $rootScope.Checklist.Questions[0].Question.PossibleResponses.push(
        {
            "Id": "d425b98d-7589-4a48-af32-6c1f78589a03",
            "Title": "Acceptable",
            "SupportingEvidence": "Suitable positioning of goods/articles.",
            "ActionRequired": "Suitable positioning of goods/articles.",
            "ResponseType": "Positive"
        });
        $rootScope.Checklist.Questions[0].Question.PossibleResponses.push({
            "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
            "Title": "Unacceptable",
            "SupportingEvidence": expectedComment,
            "ActionRequired": expectedComment,
            "ResponseType": "Negative"
        });

        $rootScope.Checklist.Questions[0].Answer.SelectedResponseId = "5d8dc0db-dcde-4181-920b-8152bdde1835";

        //when
        $rootScope.questionAnswered(questionId, $rootScope.Checklist.Questions[0].Question.PossibleResponses[1]);

        //then
        expect($rootScope.Checklist.Questions[0].Answer.SupportingEvidence).toEqual(expectedComment);
        expect($rootScope.Checklist.Questions[0].Answer.ActionRequired).toEqual(expectedComment);
    });

    it('Given i have create a new bespoke question then the question is added to the checklist when the modal is closed', function () {
        //given
        var expectedQuestion = "this is the test question";

        //setup the stupo of the fake modal to return a new question
        var fakeModal = {
            then: function (callback) {
                callback(fakeModal);
            },
            result: {
                then: function (callback) {
                    callback(expectedQuestion);
                }
            }
        };

        //setup the stub of the modal instance factory
        $modal = {
            open: function (options) {
                console.log('opened in fake modal');
                return fakeModal;
            }
        };

        var fakeModalPromise = {
            then: function (callback) {
                callback(fakeModal);
            },
            open: function (options) {
                console.log('opened in fake modal promise');
            }
        };


        var controller = createController();
        $rootScope.Checklist = { "Questions": [], "Categories": [] };
        var category = {
            "Id": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
            "Title": "Equipment"
        };
        //WHEN
        $rootScope.openAddBespokeQuestionModal(category);

        //THEN
        expect($rootScope.Checklist.Questions.length).toEqual(1);
        expect($rootScope.Checklist.Questions[0]).toEqual(expectedQuestion);

    });

    it('Given i answer a question as Not Applicable then Guidance notes are removed in response', function () {

        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        var questionId = $rootScope.Checklist.Questions[0].Question.Id;

        $rootScope.Checklist.Questions[0].Question.PossibleResponses.push(
        {
            "Id": "d425b98d-7589-4a48-af32-6c1f78589a03",
            "Title": "Not Applicable",
            "SupportingEvidence": "Suitable positioning of goods/articles.",
            "ActionRequired": "Suitable positioning of goods/articles.",
            "ResponseType": "Neutral",
            "GuidanceNotes": "4.2"
        });

        $rootScope.Checklist.Questions[0].Answer.SelectedResponseId = "5d8dc0db-dcde-4181-920b-8152bdde1835";

        //when
        $rootScope.questionAnswered(questionId, $rootScope.Checklist.Questions[0].Question.PossibleResponses[0]);

        //then
        expect($rootScope.Checklist.Questions[0].Answer.Response.GuidanceNotes).toEqual(null);
        expect($rootScope.Checklist.Questions[0].Answer.GuidanceNotes).toEqual(null);
    });

    it('Given i answer a question as Not Applicable and then Acceptable then Guidance notes are added to response', function () {

        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        var questionId = $rootScope.Checklist.Questions[0].Question.Id;

        $rootScope.Checklist.Questions[0].Question.PossibleResponses.push(
        {
            "Id": "d425b98d-7589-4a48-af32-6c1f78589a03",
            "Title": "Not Applicable",
            "SupportingEvidence": "Suitable positioning of goods/articles.",
            "ActionRequired": "Suitable positioning of goods/articles.",
            "ResponseType": "Neutral",
            "GuidanceNotes": "4.2"
        });

        $rootScope.Checklist.Questions[0].Question.PossibleResponses.push(
        {
            "Id": "d425b98d-7589-4a48-af32-6c1f78589a03",
            "Title": "Acceptable",
            "SupportingEvidence": "Suitable positioning of goods/articles.",
            "ActionRequired": "Suitable positioning of goods/articles.",
            "ResponseType": "Positive",
            "GuidanceNotes": "4.2"
        });

        $rootScope.Checklist.Questions[0].Answer.SelectedResponseId = "5d8dc0db-dcde-4181-920b-8152bdde1835";

        //when
        $rootScope.questionAnswered(questionId, $rootScope.Checklist.Questions[0].Question.PossibleResponses[0]);
        $rootScope.questionAnswered(questionId, $rootScope.Checklist.Questions[0].Question.PossibleResponses[1]);

        //then
        expect($rootScope.Checklist.Questions[0].Answer.Response.GuidanceNotes).toEqual("4.2");
        expect($rootScope.Checklist.Questions[0].Answer.GuidanceNotes).toEqual("4.2");
        expect($rootScope.Checklist.Questions[0].Answer.GuidanceNotes).not.toEqual("4.21");
    });

    it('Given i answer a question as then Document Date is initialised as null', function () {

        //given
        var controller = createController();
        $rootScope.Checklist = createChecklist();
        var questionId = $rootScope.Checklist.Questions[0].Question.Id;

        $rootScope.Checklist.Questions[0].Question.PossibleResponses.push(
        {
            "Id": "d425b98d-7589-4a48-af32-6c1f78589a03",
            "Title": "Not Applicable",
            "SupportingEvidence": "Suitable positioning of goods/articles.",
            "ActionRequired": "Suitable positioning of goods/articles.",
            "ResponseType": "Neutral",
            "GuidanceNotes": "4.2"
        });

        $rootScope.Checklist.Questions[0].Answer.SupportingDocumentationStatus = "Reported";
        $rootScope.Checklist.Questions[0].Answer.SupportingDocumentationDate = "2014-01-20T00:00:00.000Z";

        //when
        $rootScope.questionAnswered(questionId, $rootScope.Checklist.Questions[0].Question.PossibleResponses[0]);

        //then
        expect($rootScope.Checklist.Questions[0].Answer.SupportingDocumentationStatus).toEqual(null);
        expect($rootScope.Checklist.Questions[0].Answer.SupportingDocumentationDate).toEqual(null);
    });

    it('Given checklist is completed then QA Comments are enabled', function () {
        //GIVEN
        var siteId = 1312312;
        var clientId = 12314524352435;

        //WHEN     
        createController();

        var controller = createController();

        $rootScope.Checklist = {
            "Id": checklistId,
            "ClientId": 0,
            "Status": "Completed",
            "ClientDetails": {
                "Id": clientId,
                "CompanyName": "The Dental Practice",
                "CAN": "DEN101"
            },
            "SiteVisit": { "SelectedImpressionType": null },
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "PossibleResponses": [
                        ]
                    },

                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "SupportingEvidence": "",
                        "ActionRequired": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "QaComments": "Comment"
                    }
                }
            ]
        };

        //when
        $rootScope.save();
        //THEN
        expect($rootScope.areQACommentsEnabled()).toEqual(true);
    });

    it('Given checklist is not completed then QA Comments are not enabled', function () {
        //GIVEN
        var siteId = 1312312;
        var clientId = 12314524352435;

        //WHEN     
        createController();

        var controller = createController();

        $rootScope.Checklist = {
            "Id": checklistId,
            "ClientId": 0,
            "Status": "Draft",
            "ClientDetails": {
                "Id": clientId,
                "CompanyName": "The Dental Practice",
                "CAN": "DEN101"
            },
            "SiteVisit": { "SelectedImpressionType": null },
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "PossibleResponses": [
                        ]
                    },

                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "SupportingEvidence": "",
                        "ActionRequired": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "QaComments": "Comment"
                    }
                }
            ]
        };

        //when
        $rootScope.save();
        //THEN
        expect($rootScope.areQACommentsEnabled()).toEqual(false);
    });

    it('Given QA Comments are added then submit is disabled', function () {
        //GIVEN
        var clientId = 12314524352435;

        //WHEN     
        createController();

        var controller = createController();

        $rootScope.Checklist = {
            "Id": checklistId,
            "ClientId": 0,
            "Status": "Completed",
            "ClientDetails": {
                "Id": clientId,
                "CompanyName": "The Dental Practice",
                "CAN": "DEN101"
            },
            "SiteVisit": { "SelectedImpressionType": null },
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "PossibleResponses": [
                        ]
                    },

                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "SupportingEvidence": "",
                        "ActionRequired": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "QaComments": "Comment"
                    }
                }
            ]
        };

        //when
        $rootScope.save();
        //THEN
        expect($rootScope.isSubmitDisabled()).toEqual(true);
    });

    it('Given no QA Comments exist and status is completed then submit is enabled', function () {
        //GIVEN
        var clientId = 12314524352435;

        //WHEN     
        createController();

        var controller = createController();

        $rootScope.Checklist = {
            "Id": checklistId,
            "ClientId": 0,
            "Status": "Completed",
            "ClientDetails": {
                "Id": clientId,
                "CompanyName": "The Dental Practice",
                "CAN": "DEN101"
            },
            "SiteVisit": { "SelectedImpressionType": null },
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "PossibleResponses": [
                        ]
                    },

                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "SupportingEvidence": "",
                        "ActionRequired": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "QaComments": null
                    }
                }
            ]
        };

        //when
        $rootScope.save();
        //THEN
        expect($rootScope.isSubmitDisabled()).toEqual(false);
    });

    it('Given QA Comments empty and status is completed then submit is enabled', function () {
        //GIVEN
        var clientId = 12314524352435;

        //WHEN     
        createController();

        var controller = createController();

        $rootScope.Checklist = {
            "Id": checklistId,
            "ClientId": 0,
            "Status": "Completed",
            "ClientDetails": {
                "Id": clientId,
                "CompanyName": "The Dental Practice",
                "CAN": "DEN101"
            },
            "SiteVisit": { "SelectedImpressionType": null },
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "PossibleResponses": [
                        ]
                    },

                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "SupportingEvidence": "",
                        "ActionRequired": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "QaComments": ""
                    }
                }
            ]
        };

        //when
        $rootScope.save();
        //THEN
        expect($rootScope.isSubmitDisabled()).toEqual(false);
    });

    it('Given checklist with qa comments when categoryHasQaComment then result returns true', function () {
        // given
        var controller = createController();
        var checklist = {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "CategoryId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "QaComments": "comment goes here"
                    }
                }
            ]
        };
        $rootScope.Checklist = checklist;

        //when
        var result = $rootScope.categoryHasQaComment('1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6')

        //then
        expect(result).toBe(true);
    });

    it('Given checklist without qa comments when categoryHasQaComment then result returns false', function () {
        // given
        var controller = createController();
        var checklist = {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "CategoryId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "QaComments": null
                    }
                }
            ]
        };
        $rootScope.Checklist = checklist;

        //when
        var result = $rootScope.categoryHasQaComment('1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6')

        //then
        expect(result).toBe(false);
    });

    it('Given checklist with empty qa comments when categoryHasQaComment then result returns false', function () {
        // given
        var controller = createController();
        var checklist = {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "CategoryId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "QaComments": ""
                    }
                }
            ]
        };
        $rootScope.Checklist = checklist;

        //when
        var result = $rootScope.categoryHasQaComment('1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6')

        //then
        expect(result).toBe(false);
    });

    it('Given checklist with email report to other selected and no email address provided when validateOtherEmailAddresses then result false', function() {
        //given
        var controller = createController();
        var checklist = {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "EmailReportToOthers" : null
        };

        $rootScope.Checklist = checklist;

        //when
        var result = $rootScope.validateOtherEmailAddresses(checklist.EmailReportToOthers);

        //then
        expect(result).toBe(false);
    });

    it('Given checklist with email report to other selected and an invalid email address provided when validateOtherEmailAddresses then result false', function() {
        //given
        var controller = createController();
        var checklist = {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "EmailReportToOthers" : "a@bc@xyz.com"
        };

        $rootScope.Checklist = checklist;

        //when
        var result = $rootScope.validateOtherEmailAddresses(checklist.EmailReportToOthers);

        //then
        expect(result).toBe(false);
    });

    it('Given checklist with qa comments with not all QaCommentsResolved Set then result returns false', function () {
        // given
        var controller = createController();
        var checklist = {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "CategoryId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "QaComments": "comment goes here",
                        "QaCommentsResolved": true
                    }
                },
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf7",
                        "CategoryId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "QaComments": "comment goes here"
                    }
                }
            ]
        };
        $rootScope.Checklist = checklist;

        //when
        var result = $rootScope.getAllCategoryCommentsResolved('1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6');

        //then
        expect(result).toBe(false);
    });

    it('Given checklist with qa comments with all QaCommentsResolved Set then result returns true', function () {
        // given
        var controller = createController();
        var checklist = {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "CategoryId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "QaComments": "comment goes here",
                        "QaCommentsResolved": true
                    }
                },
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf7",
                        "CategoryId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "QaComments": "comment goes here",
                        "QaCommentsResolved": true
                    }
                }
            ]
        };
        $rootScope.Checklist = checklist;

        //when
        var result = $rootScope.getAllCategoryCommentsResolved('1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6');

        //then
        expect(result).toBe(true);
    });

    it('Given person seen is null when isEmployeeNotListed then returns false', function () {
        // given
        var controller = createController();

        //when
        var result = $rootScope.isEmployeeNotListed(null);
        //then
        expect(result).toBe(false);
    });

    it('Given person seen is an employee when isEmployeeNotListed then returns false', function () {

        // given
        var controller = createController();
        var person = createEmployee();

        //when
        var result = $rootScope.isEmployeeNotListed(person);
        //then
        expect(result).toBe(false);
    });

    it('Given person seen is empty guid when isEmployeeNotListed then returns true', function () {

        // given
        var controller = createController();
        var person = createEmployee();
        person.Id = emptyGuid();
        person.Name = "--Not listed--";

        //when
        var result = $rootScope.isEmployeeNotListed(person);
        //then
        expect(result).toBe(true);
    });

    it('given employee when person seen selected then name and email address are set', function () {

        // given
        var employee = createEmployee();
        employee.FullName = "Osney Kettlebeck";
        employee.EmailAddress = "ok@casterlyrock.westeros";

        var controller = createController();
        var person = { "Id": guid, "EmployeeId": employee.Id };
        $rootScope.ClientEmployees = [employee];

        //when
        var result = $rootScope.personSeenSelected(person);
        //then
        expect(person.FullName).toBe(employee.FullName);
        expect(person.EmailAddress).toBe(employee.EmailAddress);
    });

    it('given employee is not listed selection when person seen selected then name and email address are set to null', function () {

        // given
        var employee = createEmployee();
        employee.FullName = "Osney Kettlebeck";
        employee.EmailAddress = "ok@casterlyrock.westeros";

        var controller = createController();
        var person = { "Id": emptyGuid(), "FullName": "Sandor Clegane" };
        $rootScope.ClientEmployees = [employee];

        //when
        var result = $rootScope.personSeenSelected(person);
        //then
        expect(person.FullName).toBe(null);
        expect(person.EmailAddress).toBe(null);
    });

    it('given employee is not listed selected for mainPersonSeen then name and email address are set to null', function () {

        // given
        var employee = createEmployee();
        employee.FullName = "Osney Kettlebeck";
        employee.EmailAddress = "ok@casterlyrock.westeros";

        $rootScope.Checklist = createChecklist();

        var controller = createController();
        var person = { "Id": emptyGuid(), "FullName": "Sandor Clegane" };
        $rootScope.ClientEmployees = [employee];

        //when
        var result = $rootScope.mainPersonSeenSelected(person.Id);
        //then
        expect($rootScope.Checklist.SiteVisit.PersonSeen.Id).toBe(emptyGuid());
        expect($rootScope.Checklist.SiteVisit.PersonSeen.Name).toBe(null);
        expect($rootScope.Checklist.SiteVisit.EmailAddress).toBe(null);
    });

    it('given employee selected for mainPersonSeen then name and email address are set', function () {

        // given
        var employee = createEmployee();
        employee.FullName = "Osney Kettlebeck";
        employee.EmailAddress = "ok@casterlyrock.westeros";

        $rootScope.Checklist = createChecklist();

        var controller = createController();
        var person = { "Id": employee.Id, "FullName": "Sandor Clegane" };
        $rootScope.ClientEmployees = [employee];

        //when
        var result = $rootScope.mainPersonSeenSelected(person.Id);
        //then
        expect($rootScope.Checklist.SiteVisit.PersonSeen.Id).toBe(employee.Id);
        expect($rootScope.Checklist.SiteVisit.PersonSeen.Name).toBe(employee.FullName);
        expect($rootScope.Checklist.SiteVisit.EmailAddress).toBe(employee.EmailAddress);
    });

});
