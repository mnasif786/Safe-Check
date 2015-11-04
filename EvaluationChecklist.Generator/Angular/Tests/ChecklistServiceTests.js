describe('Checklist service', function() {

    var checklistService;
    var $httpBackend;
    var $modal;
    var config;
    var $filter;
    var checklistId = "f1987c56-35a7-c7f3-fa22-a0f7b594e55c";
    var $rootScope;

    var createChecklist = function() {
        return {
            "Id": checklistId,
            "ClientId": 33749,
            "SiteId": null,
            "Categories": [
                {
                    "Id": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
                    "Title": "Equipment",
                    "Questions": [
                        {
                            "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                            "PossibleResponses": [],
                            "Answer": {
                                "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                                "SelectedResponseId": null,
                                "Comment": "",
                                "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                            }
                        }
                    ]
                }
            ],
            "Questions": [
                {
                    "Question": {
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "Text": "If required, is there a suitable asbestos management plan in place?",
                        "PossibleResponses": [
                        ]
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "Comment": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    }
                }
            ],
            "SiteVisit": { "SelectedImpressionType": null },
            "Status": null,
            "LastModifiedOn": new Date('15/04/2014 10:06:54')
    };
    };

    var createChecklistWithQuestionsWithoutTextAndPossibleResponses = function() {
        return {
            "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
            "ClientId": 33749,
            "SiteId": null,
            "Categories": [
                {
                    "Id": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
                    "Title": "Equipment",
                    "Questions": [{
                        "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                        "PossibleResponses": [],
                        "Answer": {
                            "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                            "SelectedResponseId": null,
                            "Comment": "",
                            "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                        }
                    }]
                }
            ],
            "Questions": [
                {
                    "Question": {
                        "Id": "f9b5db39-d7e4-4fea-baae-0098b6a94684",
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "Comment": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    }
                },
                {
                    "Question": {
                        "Id": "4b55802f-bf90-4732-a941-04d074c98e33",
                    },
                    "Answer": {
                        "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                        "SelectedResponseId": null,
                        "Comment": "",
                        "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                    }
                }
            ],
            "SiteVisit": { "SelectedImpressionType": null }
        };
    };

    var getCompleteSetOfQuestionsArray = function() {
        return [
            {
                "Id": "f9b5db39-d7e4-4fea-baae-0098b6a94684",
                "Text": "Do persons who drive on the public highway as part of their work activities using their own transport have adequate business insurance cover?",
                "PossibleResponses": [
                    {
                        "Id": "b4b50104-35c6-406e-bbb0-20fb5fcb393b",
                        "Title": "Not Applicable",
                        "SupportingEvidence": "",
                        "ActionRequired": "",
                        "ResponseType": "Neutral",
                        "GuidanceNotes": "4.31",
                        "ReportLetterStatement": "",
                        "ReportLetterStatementCategory": null
                    },
                    {
                        "Id": "25b13207-22f8-4382-8ce0-814e4b28b46d",
                        "Title": "Acceptable",
                        "SupportingEvidence": "Suitable business insurance cover is in place.",
                        "ActionRequired": "",
                        "ResponseType": "Positive",
                        "GuidanceNotes": "4.31",
                        "ReportLetterStatement": "",
                        "ReportLetterStatementCategory": null
                    },
                    {
                        "Id": "cc6cfd85-5ea8-490b-8f7e-b0a586466a96",
                        "Title": "Unacceptable",
                        "SupportingEvidence": "",
                        "ActionRequired": "Ensure that suitable business insurance cover is in place.",
                        "ResponseType": "Negative",
                        "GuidanceNotes": "4.31",
                        "ReportLetterStatement": "Drivers of own vehicles without business insurance",
                        "ReportLetterStatementCategory": null
                    }
                ],
                "CategoryId": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                "Category": {
                    "Id": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                    "Title": "Care",
                    "OrderNumber": 1,
                    "Questions": [
                    ]
                },
                "Mandatory": true,
                "SpecificToClientId": null,
                "OrderNumber": 1
            },
            {
                "Id": "4b55802f-bf90-4732-a941-04d074c98e33",
                "Text": "Have risk assessments been carried out for display screen equipment with suitable control measures implemented?",
                "PossibleResponses": [
                    {
                        "Id": "48f6bab5-35df-4c9e-be71-0972a407bec2",
                        "Title": "Improvement Required",
                        "SupportingEvidence": "",
                        "ActionRequired": "Carry out risk assessments for DSE users. Ensure that these are documented and any further control measures are implemented. Risk assessments should be reviewed at least annually",
                        "ResponseType": "neutral",
                        "GuidanceNotes": "1.1",
                        "ReportLetterStatement": "Inadequate DSE risk assessments",
                        "ReportLetterStatementCategory": null
                    },
                    {
                        "Id": "c547f015-2bbe-4570-8186-6c38581398e3",
                        "Title": "Unacceptable",
                        "SupportingEvidence": "",
                        "ActionRequired": "Carry out risk assessments for DSE users. Ensure that these are documented and any further control measures are implemented. Risk assessments should be reviewed at least annually",
                        "ResponseType": "Negative",
                        "GuidanceNotes": "1.1",
                        "ReportLetterStatement": "Insufficient risk assessment for use of DSE",
                        "ReportLetterStatementCategory": null
                    },
                    {
                        "Id": "7608147b-489a-4e8e-88c3-a0848e93d9f4",
                        "Title": "Acceptable",
                        "SupportingEvidence": "Risk assessment carried out/reviewed within last twelve months.",
                        "ActionRequired": "",
                        "ResponseType": "Positive",
                        "GuidanceNotes": "1.1",
                        "ReportLetterStatement": "",
                        "ReportLetterStatementCategory": null
                    }
                ],
                "CategoryId": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                "Category": {
                    "Id": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                    "Title": "Care",
                    "Questions": [
                    ]
                },
                "Mandatory": true,
                "SpecificToClientId": null,
                "OrderNumber": 2
            }
        ];
    };

    var getLargeQuestionsArray = function() {
        return [
            {
                "Id": "f9b5db39-d7e4-4fea-baae-0098b6a94684",
                "Text": "Do persons who drive on the public highway as part of their work activities using their own transport have adequate business insurance cover?",
                "PossibleResponses": [
                    {
                        "Id": "b4b50104-35c6-406e-bbb0-20fb5fcb393b",
                        "Title": "Not Applicable"
                    },
                    {
                        "Id": "25b13207-22f8-4382-8ce0-814e4b28b46d",
                        "Title": "Acceptable"
                    },
                    {
                        "Id": "cc6cfd85-5ea8-490b-8f7e-b0a586466a96",
                        "Title": "Unacceptable"
                    }
                ],
                "CategoryId": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                "Category": {
                    "Id": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                    "Title": "Care",
                    "OrderNumber": 1,
                    "Questions":
                        [
                        ]
                },
                "Mandatory": true,
                "SpecificToClientId": null,
                "OrderNumber": 1
            },

            {
                "Id": "4b55802f-bf90-4732-a941-04d074c98e33",
                "Text": "Have risk assessments been carried out for display screen equipment with suitable control measures implemented?",
                "PossibleResponses": [
                    {
                        "Id": "48f6bab5-35df-4c9e-be71-0972a407bec2",
                        "Title": "Improvement Required"

                    },
                    {
                        "Id": "c547f015-2bbe-4570-8186-6c38581398e3",
                        "Title": "Unacceptable"

                    },
                    {
                        "Id": "7608147b-489a-4e8e-88c3-a0848e93d9f4",
                        "Title": "Acceptable"

                    }
                ],
                "CategoryId": "8BEB254C-4D14-40C5-980E-0962E8062C4C",
                "Category": {
                    "Id": "8BEB254C-4D14-40C5-980E-0962E8062C4C",
                    "Title": "Leisure",
                    "OrderNumber": 2,
                    "Questions": [
                    ]
                },
                "Mandatory": true,
                "SpecificToClientId": null,
                "OrderNumber": 3
            },

            {
                "Id": "4b55802f-bf90-4732-a941-04d074c98e33",
                "Text": "Have risk assessments been carried out for display screen equipment with suitable control measures implemented?",
                "PossibleResponses": [
                    {
                        "Id": "48f6bab5-35df-4c9e-be71-0972a407bec2",
                        "Title": "Improvement Required"

                    },
                    {
                        "Id": "c547f015-2bbe-4570-8186-6c38581398e3",
                        "Title": "Unacceptable"

                    },
                    {
                        "Id": "7608147b-489a-4e8e-88c3-a0848e93d9f4",
                        "Title": "Acceptable"

                    }
                ],
                "CategoryId": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                "Category": {
                    "Id": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                    "Title": "Care",
                    "OrderNumber": 1,
                    "Questions": [
                    ]
                },
                "Mandatory": true,
                "SpecificToClientId": null,
                "OrderNumber": 2
            },

            {
                "Id": "4b55802f-bf90-4732-a941-04d074c98e33",
                "Text": "Have risk assessments been carried out for display screen equipment with suitable control measures implemented?",
                "PossibleResponses": [
                    {
                        "Id": "48f6bab5-35df-4c9e-be71-0972a407bec2",
                        "Title": "Improvement Required"

                    },
                    {
                        "Id": "c547f015-2bbe-4570-8186-6c38581398e3",
                        "Title": "Unacceptable"

                    },
                    {
                        "Id": "7608147b-489a-4e8e-88c3-a0848e93d9f4",
                        "Title": "Acceptable"

                    }
                ],
                "CategoryId": "56EF76E0-0720-4CAD-90CF-DC53688296E1",
                "Category": {
                    "Id": "56EF76E0-0720-4CAD-90CF-DC53688296E1",
                    "Title": "Retail",
                    "OrderNumber": 3,
                    "Questions": [
                    ]
                },
                "Mandatory": true,
                "SpecificToClientId": null,
                "OrderNumber": 6
            },

            {
                "Id": "4b55802f-bf90-4732-a941-04d074c98e33",
                "Text": "Have risk assessments been carried out for display screen equipment with suitable control measures implemented?",
                "PossibleResponses": [
                    {
                        "Id": "48f6bab5-35df-4c9e-be71-0972a407bec2",
                        "Title": "Improvement Required"

                    },
                    {
                        "Id": "c547f015-2bbe-4570-8186-6c38581398e3",
                        "Title": "Unacceptable"

                    },
                    {
                        "Id": "7608147b-489a-4e8e-88c3-a0848e93d9f4",
                        "Title": "Acceptable"

                    }
                ],
                "CategoryId": "56EF76E0-0720-4CAD-90CF-DC53688296E1",
                "Category": {
                    "Id": "56EF76E0-0720-4CAD-90CF-DC53688296E1",
                    "Title": "Retail",
                    "OrderNumber": 3,
                    "Questions": [
                    ]
                },
                "Mandatory": true,
                "SpecificToClientId": null,
                "OrderNumber": 5
            },



            {
                "Id": "4b55802f-bf90-4732-a941-04d074c98e33",
                "Text": "Have risk assessments been carried out for display screen equipment with suitable control measures implemented?",
                "PossibleResponses": [
                    {
                        "Id": "48f6bab5-35df-4c9e-be71-0972a407bec2",
                        "Title": "Improvement Required"

                    },
                    {
                        "Id": "c547f015-2bbe-4570-8186-6c38581398e3",
                        "Title": "Unacceptable"

                    },
                    {
                        "Id": "7608147b-489a-4e8e-88c3-a0848e93d9f4",
                        "Title": "Acceptable"

                    }
                ],
                "CategoryId": "8BEB254C-4D14-40C5-980E-0962E8062C4C",
                "Category": {
                    "Id": "8BEB254C-4D14-40C5-980E-0962E8062C4C",
                    "Title": "Leisure",
                    "OrderNumber": 2,
                    "Questions": [
                    ]
                },
                "Mandatory": true,
                "SpecificToClientId": null,
                "OrderNumber": 4
            }
        ];
    };



    beforeEach(function() {
        module('clientemployeeService');
        module('clientQuestionService');
        module('checklistTemplateService');  
        module('checklistService');
        module('configService');
        module('ui.bootstrap.modal');
        module('clientServiceREST');

    });

    beforeEach(inject(function($injector) {
        $modal = $injector.get('$modal');

        checklistService = $injector.get("ChecklistService");
        checklistTemplateService = $injector.get("ChecklistTemplateService");
        
        $httpBackend = $injector.get('$httpBackend');
        $filter = $injector.get('$filter');
        
        var configService = $injector.get('ConfigService');
        config = configService.getConfig();
        
        $rootScope = $injector.get('$rootScope');
        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function () { return this.online; };

       
    }));

    afterEach(function () {
        localStorage.removeItem("Checklist." + checklistId);
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('Given i create a new checklist then the siteId and clientId are set', function() {
        //GIVEN
        var siteId = 1312312;
        var clientId = 12314524352435;

        //WHEN
        var result = checklistService.create(clientId, siteId);

        //THEN
        expect(result.ClientId).toEqual(clientId);
        expect(result.SiteId).toEqual(siteId);
    });

    it('Given i create a new checklist then the createdOn and CreatedBy are set', function() {
        //GIVEN
        var siteId = 1312312;
        var clientId = 12314524352435;
        var d = new Date();
        var user = { };
        user.fullname = function() {
            return 'username';
        };
        //WHEN
        var result = checklistService.create(clientId, siteId, null, null, user);

        //THEN
        expect(result.CreatedBy).toEqual("username");
        expect(result.CreatedOn.toLocaleDateString()).toEqual(d.toLocaleDateString());
    });

    it('Given client id when get by client id then calls correct api', function() {
        var clientId = 1234;

        $httpBackend.whenGET(config.apiUrl + 'clients/' + clientId + '/checklists').respond({ "SiteVisit": { "VisitBy": "" } });
        var result = checklistService.getByClientId(clientId);

        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
    });

    it('Given i add a standard question to the checklist then the question list is updated', function() {

        var checklist = createChecklist();
        checklist.Questions = [];

        var questionToAdd = {
            "Id": "5343708d-eac8-4aaf-869d-5978ea1a0d99",
            "Text": "Is all work equipment and machinery selected so as to be suitable and properly maintained?",
            "PossibleResponses": [
                {
                    "Id": "bed5afe7-311d-4c53-85bc-28c9596196bf",
                    "Title": "Unacceptable",
                    "Comment": "Ensure that work equipment is selected so as to be suitable for the purpose required. Ensure that it can be properly maintained.",
                    "ResponseType": "Negative"
                }
            ],
            "CategoryId": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
            "Category": {
                "Id": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
                "Title": "Equipment",
                "Questions": [
                ]
            }
        }
        var questionsToAdd = [questionToAdd];

        checklist = checklistService.addQuestions(checklist, questionsToAdd);
        expect(checklist.Questions.length).toBeGreaterThan(0);
    });

    it('Given i add a standard question to the checklist and the question is already added then the question list is NOT updated. Prevent duplication of questions', function() {

        var checklist = createChecklist();
        checklist.Questions = [];

        var questionToAdd = {
            "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
            "Category": {
                "Id": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
                "Title": "Equipment",
                "Questions": [
                ]
            }
        }

        var questionAnswer = {
            "Question": {
                "Id": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6",
                "Category": {
                    "Id": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
                    "Title": "Equipment",
                    "Questions": [
                    ]
                }

            }
        }

        checklist.Questions.push(questionAnswer);
        var questionsToAdd = [questionToAdd];
        checklist = checklistService.addQuestions(checklist, questionsToAdd);

        expect(1).toEqual(checklist.Questions.length);
    });

    it('Given i add a standard question to the checklist then the checklist category exists in the checklist', function() {

        var checklist = createChecklist();
        checklist.Questions = [];
        checklist.Categories = [];

        var questionToAdd = {
            "Id": "5343708d-eac8-4aaf-869d-5978ea1a0d99",
            "CategoryId": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
            "Category": {
                "Id": "879f3774-f4d6-42b1-a4d8-20eea35bec1f",
                "Title": "Equipment",
                "Questions": [
                ]
            }
        }

        var questionsToAdd = [questionToAdd];
        checklist = checklistService.addQuestions(checklist, questionsToAdd);

        expect(checklist.Categories[0]).toBeDefined("Category not defined");
        expect(checklist.Categories[0].Id).toEqual(questionToAdd.Category.Id);
    });


    it('given i have a checklist when saved to localStorage then only the question id is saved', function() {

        var checklist = createChecklist();
        var questionId = checklist.Questions[0].Question.Id;
        checklist.Status = "Draft";

        //save to local storage
        checklistService.saveToLocalStorage(checklist);

        var result = [];
        for (var key in localStorage) {
            if (key.indexOf("Checklist." + checklist.Id) > -1) {
                result.push(JSON.parse(localStorage.getItem(key)));
            }
        }

        //assert that only the question id exists in the object returned from local storage
        expect(result[0].Questions[0].Question.Id).toEqual(questionId);
        expect(result[0].Questions[0].Question.Text).toBeUndefined();
        expect(result[0].Questions[0].Question.PossibleResponses).toBeUndefined();
    });

    it('Given i have a checklist when retrieved from local storage then the question contains the Text and Possible Responses', function() {

        var checklist = createChecklistWithQuestionsWithoutTextAndPossibleResponses();
        var questionId = checklist.Questions[0].Question.Id;

        var completeSetOfQuestionsArray = getCompleteSetOfQuestionsArray();
        var questionText = completeSetOfQuestionsArray[0].Text;


        var result = checklistService.inflateQuestionsWithTextAndResponses(completeSetOfQuestionsArray, checklist);

        expect(result.Questions[0].Question.Id).toEqual(questionId);
        expect(result.Questions[0].Question.Text).toBeDefined(questionText);

    });


    it('Given I create a new checklist then the first question number in each category is 1', function()
    {
        //GIVEN
        var siteId = 1312312;
        var clientId = 12314524352435;

        //WHEN
        var checklist = checklistService.create(clientId, siteId);
        var returnedChecklist = checklistService.addQuestions(checklist, getLargeQuestionsArray());


        //THEN
        var orderedCategories = checklist.Categories.sort(function(a, b) { return a.OrderNumber - b.OrderNumber; });

        $.each(orderedCategories, function(idx, category) {

            var categoryQuestions = [];

            $.each(checklist.Questions, function(qIdx, question)
            {
                if (question.Question.CategoryId == category.Id)
                {
                    categoryQuestions.push(question);
                }
            });

            $.each(categoryQuestions, function(qIdx, question)
            {
                expect(question.QuestionNumber).toBe(qIdx + 1);
                expect(question.CategoryNumber).toBe(idx + 1);
            });

            if (category.Title == 'Care') {
                expect(categoryQuestions[0].Question.Id).toBe('f9b5db39-d7e4-4fea-baae-0098b6a94684');
                expect(categoryQuestions[1].Question.Id).toBe('4b55802f-bf90-4732-a941-04d074c98e33');
            }
        });
    });

    it('Given I add a question to a checklist then the new question is numbered correctly', function()
    {
        //GIVEN
        var siteId = 1312312;
        var clientId = 12314524352435;

        //WHEN
        var checklist = checklistService.create(clientId, siteId);
        checklistService.addQuestions(checklist, getLargeQuestionsArray());

        var newQuestionArray =
            [
                {
                    "Id": "f86ea715-5abd-4cf0-a9fb-2d3a4ea7b4de",
                    "Text": "Do persons who drive on the public highway as part of their work activities using their own transport have adequate business insurance cover?",
                    "PossibleResponses": [
                        {
                            "Id": "b4b50104-35c6-406e-bbb0-20fb5fcb393b",
                            "Title": "Not Applicable"
                        },
                        {
                            "Id": "25b13207-22f8-4382-8ce0-814e4b28b46d",
                            "Title": "Acceptable"
                        },
                        {
                            "Id": "cc6cfd85-5ea8-490b-8f7e-b0a586466a96",
                            "Title": "Unacceptable"
                        }
                    ],
                    "CategoryId": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                    "Category": {
                        "Id": "6072afa8-1d21-40cb-8396-cfa126d9c358",
                        "Title": "Care",
                        "OrderNumber": 10,
                        "Questions":
                            [
                            ]
                    },
                    "Mandatory": true,
                    "SpecificToClientId": null,
                    "OrderNumber": 1
                }
            ];

        checklistService.addQuestions(checklist, newQuestionArray);

        //THEN
        var orderedCategories = checklist.Categories.sort(function(a, b) { return a.OrderNumber - b.OrderNumber; });

        $.each(orderedCategories, function(idx, category) {

            var categoryQuestions = [];

            $.each(checklist.Questions, function(qIdx, question)
            {
                if (question.Question.CategoryId == category.Id)
                {
                    categoryQuestions.push(question);
                }
            });

            $.each(categoryQuestions, function(qIdx, question)
            {
                expect(question.QuestionNumber).toBe(qIdx + 1);
                expect(question.CategoryNumber).toBe(idx + 1);
            });

            if (category.Title == 'Care') {
                expect(categoryQuestions[0].Question.Id).toBe('f9b5db39-d7e4-4fea-baae-0098b6a94684');
                expect(categoryQuestions[1].Question.Id).toBe('4b55802f-bf90-4732-a941-04d074c98e33');
                expect(categoryQuestions[2].Question.Id).toBe('f86ea715-5abd-4cf0-a9fb-2d3a4ea7b4de');
            }
        });
    });

    xit('given i add a checklist to localStorage when local storage is full then error is thrown', function()
    {
        var MAX_CHECKLISTS = 106; // chrome max checklists before it fails

        for (var i = 0; i < MAX_CHECKLISTS; i++)
        {
            var checklist = getFullChecklistWithCompleteSetofQuestions;

            //save to local storage
            var idx = ("000" + i);
            checklist.Id = "00000000-0000-0000-0000-000000000" + idx.substr(idx.length - 3);
            checklistService.saveToLocalStorage(checklist);
        }

        // Last checklist should cause an exception
        var lastChecklist = getFullChecklistWithCompleteSetofQuestions;

        expect(function() { checklistService.saveToLocalStorage(checklist); }).toThrow(new Error("Local Storage Is Full"));
    });


    var getFullChecklistWithCompleteSetofQuestions =
            { "Id": "a68568d6-4f13-89ae-3eb2-4c03e4dcc92e", "SiteId": "1557154", "ClientId": 55881, "Submit": false, "CoveringLetterContent": "",
                "Categories": [{ "Id": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Title": "Documentation", "Questions": [], "OrderNumber": 1, "TabTitle": "DOCS" }, 
                    { "Id": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Title": "Safety Arrangements", "Questions": [], "OrderNumber": 7, "TabTitle": "SAs" }, 
                    { "Id": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Title": "People Management", "Questions": [], "OrderNumber": 4, "TabTitle": "PEOPLE" }, 
                    { "Id": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Title": "Risk Assessments", "Questions": [], "OrderNumber": 6, "TabTitle": "RAs" }, 
                    { "Id": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Title": "Fire", "Questions": [], "OrderNumber": 3, "TabTitle": "FIRE" }, 
                    { "Id": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Title": "Premises Management", "Questions": [], "OrderNumber": 5, "TabTitle": "PREMISES" }, { "Id": "3755dc4d-af28-4c03-a3a0-89ad5b76e26a", "Title": "Equipment", "Questions": [], "OrderNumber": 2, "TabTitle": "EQUIPMENT" }, { "Id": "097b45db-450b-4040-b365-ddc9aaf709fe", "Title": "Other subjects", "Questions": [], "OrderNumber": 8, "TabTitle": "OTHER" }], "ImmediateRiskNotifications": [], "Questions": [{ "Question": { "Id": "f04cc2a0-2a18-46af-b7c0-b09f56520720", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 1 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "f04cc2a0-2a18-46af-b7c0-b09f56520720" }, "QuestionNumber": 1, "CategoryNumber": 1 }, { "Question": { "Id": "09005590-0acc-4533-985c-6da6a3915542", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 2 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "09005590-0acc-4533-985c-6da6a3915542" }, "QuestionNumber": 2, "CategoryNumber": 1 }, { "Question": { "Id": "ddacbfac-0745-4b64-bfb6-b96735bf09f5", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 3 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "ddacbfac-0745-4b64-bfb6-b96735bf09f5" }, "QuestionNumber": 3, "CategoryNumber": 1 }, { "Question": { "Id": "718eb8a9-7d31-40c4-9c6a-1a4fe195c573", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 4 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "718eb8a9-7d31-40c4-9c6a-1a4fe195c573" }, "QuestionNumber": 4, "CategoryNumber": 1 }, { "Question": { "Id": "b1cd0da9-8b29-4eda-84e1-c45e7b9cc650", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 5 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b1cd0da9-8b29-4eda-84e1-c45e7b9cc650" }, "QuestionNumber": 5, "CategoryNumber": 1 }, { "Question": { "Id": "744b9a87-0ae7-46d2-b1f4-837eacbda49b", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 6 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "744b9a87-0ae7-46d2-b1f4-837eacbda49b" }, "QuestionNumber": 6, "CategoryNumber": 1 }, { "Question": { "Id": "a09594b8-e083-4ab6-81dc-9a280e9a5848", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 7 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "a09594b8-e083-4ab6-81dc-9a280e9a5848" }, "QuestionNumber": 1, "CategoryNumber": 7 }, { "Question": { "Id": "70bbf6ee-9c63-4661-8750-d8426dab6651", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 7 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "70bbf6ee-9c63-4661-8750-d8426dab6651" }, "QuestionNumber": 7, "CategoryNumber": 1 }, { "Question": { "Id": "a3aeffb3-e97c-46f2-be6e-66ab8c92e9fc", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 8 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "a3aeffb3-e97c-46f2-be6e-66ab8c92e9fc" }, "QuestionNumber": 8, "CategoryNumber": 1 }, { "Question": { "Id": "2f33388a-5757-463e-8c0b-471f2956716d", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 9 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "2f33388a-5757-463e-8c0b-471f2956716d" }, "QuestionNumber": 9, "CategoryNumber": 1 }, { "Question": { "Id": "4ebcf83a-f8dd-4ba6-8566-5bac2cb061b3", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 10 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "4ebcf83a-f8dd-4ba6-8566-5bac2cb061b3" }, "QuestionNumber": 10, "CategoryNumber": 1 }, { "Question": { "Id": "0cf3a316-3e96-446a-8bbf-87200619d60c", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 11 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "0cf3a316-3e96-446a-8bbf-87200619d60c" }, "QuestionNumber": 1, "CategoryNumber": 4 }, { "Question": { "Id": "d81b9355-0c16-4831-8670-8cfd002c09c9", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 12 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "d81b9355-0c16-4831-8670-8cfd002c09c9" }, "QuestionNumber": 11, "CategoryNumber": 1 }, { "Question": { "Id": "740b7374-5d57-48df-b27f-a57352e8b4f0", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 13 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "740b7374-5d57-48df-b27f-a57352e8b4f0" }, "QuestionNumber": 12, "CategoryNumber": 1 }, { "Question": { "Id": "7f04a187-1dd8-4e66-8223-9fcccb6e6f0c", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 14 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "7f04a187-1dd8-4e66-8223-9fcccb6e6f0c" }, "QuestionNumber": 13, "CategoryNumber": 1 }, { "Question": { "Id": "bc7a4978-3e28-46d3-a60b-8107c4fac97b", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 15 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "bc7a4978-3e28-46d3-a60b-8107c4fac97b" }, "QuestionNumber": 14, "CategoryNumber": 1 }, { "Question": { "Id": "4f78fc57-8823-4e97-8a42-9ebc8a54491b", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 16 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "4f78fc57-8823-4e97-8a42-9ebc8a54491b" }, "QuestionNumber": 15, "CategoryNumber": 1 }, { "Question": { "Id": "07a483ee-da8a-433d-8283-a45b899f37bf", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 17 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "07a483ee-da8a-433d-8283-a45b899f37bf" }, "QuestionNumber": 16, "CategoryNumber": 1 }, { "Question": { "Id": "548d65ba-a710-45fe-98a9-dd8e8a40ede2", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 18 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "548d65ba-a710-45fe-98a9-dd8e8a40ede2" }, "QuestionNumber": 17, "CategoryNumber": 1 }, { "Question": { "Id": "760a9e3f-73de-4784-b97f-82a68a46ae1d", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 18 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "760a9e3f-73de-4784-b97f-82a68a46ae1d" }, "QuestionNumber": 18, "CategoryNumber": 1 }, { "Question": { "Id": "2e50bb04-a611-463d-ba05-0371aa768599", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 19 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "2e50bb04-a611-463d-ba05-0371aa768599" }, "QuestionNumber": 19, "CategoryNumber": 1 }, { "Question": { "Id": "0c9b16d7-e081-46f0-9317-a87c6248e2de", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 20 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "0c9b16d7-e081-46f0-9317-a87c6248e2de" }, "QuestionNumber": 20, "CategoryNumber": 1 }, { "Question": { "Id": "f92dd1a7-015c-432c-87e6-805054aa999d", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 21 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "f92dd1a7-015c-432c-87e6-805054aa999d" }, "QuestionNumber": 21, "CategoryNumber": 1 }, { "Question": { "Id": "51c44cd5-7286-4564-9ac4-f2aaabb2289f", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 22 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "51c44cd5-7286-4564-9ac4-f2aaabb2289f" }, "QuestionNumber": 22, "CategoryNumber": 1 }, { "Question": { "Id": "296a2c89-64a4-4c70-b776-803cd60bc8f7", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 23 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "296a2c89-64a4-4c70-b776-803cd60bc8f7" }, "QuestionNumber": 23, "CategoryNumber": 1 }, { "Question": { "Id": "4203544c-df86-4adb-b51e-3495f17efda3", "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 24 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "4203544c-df86-4adb-b51e-3495f17efda3" }, "QuestionNumber": 24, "CategoryNumber": 1 }, { "Question": { "Id": "fa4d2bfb-5835-4336-9117-db32b974bbf0", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 30 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "fa4d2bfb-5835-4336-9117-db32b974bbf0" }, "QuestionNumber": 2, "CategoryNumber": 7 }, { "Question": { "Id": "8a0e3bf0-6185-4a5b-9831-c1d4d91c70e5", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 31 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "8a0e3bf0-6185-4a5b-9831-c1d4d91c70e5" }, "QuestionNumber": 3, "CategoryNumber": 7 }, { "Question": { "Id": "433746e7-373a-43f2-b4c8-3ed3a01ad61d", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 32 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "433746e7-373a-43f2-b4c8-3ed3a01ad61d" }, "QuestionNumber": 4, "CategoryNumber": 7 }, { "Question": { "Id": "4ca671ff-681a-4212-b345-8c6d0d006dfc", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 33 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "4ca671ff-681a-4212-b345-8c6d0d006dfc" }, "QuestionNumber": 5, "CategoryNumber": 7 }, { "Question": { "Id": "f9e4c421-1b85-4de7-abf7-ce946f2b5f05", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 34 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "f9e4c421-1b85-4de7-abf7-ce946f2b5f05" }, "QuestionNumber": 6, "CategoryNumber": 7 }, { "Question": { "Id": "f645b0fb-9afe-40cc-a577-ec141926c5cc", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 35 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "f645b0fb-9afe-40cc-a577-ec141926c5cc" }, "QuestionNumber": 7, "CategoryNumber": 7 }, { "Question": { "Id": "aca7efe5-5de2-4b2f-958a-31fad471689c", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 36 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "aca7efe5-5de2-4b2f-958a-31fad471689c" }, "QuestionNumber": 8, "CategoryNumber": 7 }, { "Question": { "Id": "3f688287-cec0-41e2-a906-ba3a11c2f5b2", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 37 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "3f688287-cec0-41e2-a906-ba3a11c2f5b2" }, "QuestionNumber": 9, "CategoryNumber": 7 }, { "Question": { "Id": "2029b4ae-fc30-4c09-b7d6-90a258e044b3", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 42 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "2029b4ae-fc30-4c09-b7d6-90a258e044b3" }, "QuestionNumber": 10, "CategoryNumber": 7 }, { "Question": { "Id": "3f3ef281-536f-4707-9733-f73c4606e42c", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 46 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "3f3ef281-536f-4707-9733-f73c4606e42c" }, "QuestionNumber": 11, "CategoryNumber": 7 }, { "Question": { "Id": "724634b3-69b0-4cf0-ba55-8c88cde7d0c6", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 47 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "724634b3-69b0-4cf0-ba55-8c88cde7d0c6" }, "QuestionNumber": 12, "CategoryNumber": 7 }, { "Question": { "Id": "9e999370-88d0-4492-97dc-909752979bde", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 48 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "9e999370-88d0-4492-97dc-909752979bde" }, "QuestionNumber": 13, "CategoryNumber": 7 }, { "Question": { "Id": "8900e13a-bee0-4c9d-934e-7e1e1c2db1b2", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 50 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "8900e13a-bee0-4c9d-934e-7e1e1c2db1b2" }, "QuestionNumber": 14, "CategoryNumber": 7 }, { "Question": { "Id": "c0a491f1-d65d-4ff0-98fe-99e4632c83db", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 66 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c0a491f1-d65d-4ff0-98fe-99e4632c83db" }, "QuestionNumber": 15, "CategoryNumber": 7 }, { "Question": { "Id": "ade2c5cd-be9e-42be-89c4-3ebb94cad035", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 67 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "ade2c5cd-be9e-42be-89c4-3ebb94cad035" }, "QuestionNumber": 16, "CategoryNumber": 7 }, { "Question": { "Id": "691c9048-414f-4bfe-bde0-3e39a430b53a", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 68 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "691c9048-414f-4bfe-bde0-3e39a430b53a" }, "QuestionNumber": 17, "CategoryNumber": 7 }, { "Question": { "Id": "b2055066-754b-4b04-9d67-b9a4ee46e56c", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 69 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b2055066-754b-4b04-9d67-b9a4ee46e56c" }, "QuestionNumber": 18, "CategoryNumber": 7 }, { "Question": { "Id": "11eb9706-3913-49f6-b729-fc8a52c9959e", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 69 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "11eb9706-3913-49f6-b729-fc8a52c9959e" }, "QuestionNumber": 19, "CategoryNumber": 7 }, { "Question": { "Id": "982115b5-af5b-42c3-8e34-1f4d91e5e607", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 70 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "982115b5-af5b-42c3-8e34-1f4d91e5e607" }, "QuestionNumber": 20, "CategoryNumber": 7 }, { "Question": { "Id": "541bb69d-5d2c-468d-859a-87dafe42dd44", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 71 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "541bb69d-5d2c-468d-859a-87dafe42dd44" }, "QuestionNumber": 21, "CategoryNumber": 7 }, { "Question": { "Id": "86c469bb-7717-4c92-95a4-91ec83d7a707", "CategoryId": "2a2269e4-b400-49ac-b07c-a56f6eab8c8e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 73 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "86c469bb-7717-4c92-95a4-91ec83d7a707" }, "QuestionNumber": 22, "CategoryNumber": 7 }, { "Question": { "Id": "a889dc83-b7c8-4cdb-b467-bbf9a4e35d5e", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 77 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "a889dc83-b7c8-4cdb-b467-bbf9a4e35d5e" }, "QuestionNumber": 1, "CategoryNumber": 6 }, { "Question": { "Id": "05f7a307-583a-42b5-9716-862e3d362a8c", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 78 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "05f7a307-583a-42b5-9716-862e3d362a8c" }, "QuestionNumber": 2, "CategoryNumber": 6 }, { "Question": { "Id": "b85ac1d8-05b7-4cb4-bd24-c13e224fcfa5", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 79 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b85ac1d8-05b7-4cb4-bd24-c13e224fcfa5" }, "QuestionNumber": 3, "CategoryNumber": 6 }, { "Question": { "Id": "77e31fd6-9f5f-4b22-834f-9aafb4fcccef", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 80 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "77e31fd6-9f5f-4b22-834f-9aafb4fcccef" }, "QuestionNumber": 4, "CategoryNumber": 6 }, { "Question": { "Id": "a2607638-b014-4712-b1cb-2b99bf3d3eac", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 81 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "a2607638-b014-4712-b1cb-2b99bf3d3eac" }, "QuestionNumber": 5, "CategoryNumber": 6 }, { "Question": { "Id": "f8f89a95-3696-4718-afcb-901143d76b6e", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 82 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "f8f89a95-3696-4718-afcb-901143d76b6e" }, "QuestionNumber": 6, "CategoryNumber": 6 }, { "Question": { "Id": "8651198d-6ba6-4d8e-a22a-aa004ec6abd6", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 83 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "8651198d-6ba6-4d8e-a22a-aa004ec6abd6" }, "QuestionNumber": 7, "CategoryNumber": 6 }, { "Question": { "Id": "ddeff5e5-90dc-46bf-aeff-404a42e9d6b4", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 84 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "ddeff5e5-90dc-46bf-aeff-404a42e9d6b4" }, "QuestionNumber": 8, "CategoryNumber": 6 }, { "Question": { "Id": "2c0b20bb-e1a0-429c-b6de-461591d6fc93", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 85 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "2c0b20bb-e1a0-429c-b6de-461591d6fc93" }, "QuestionNumber": 9, "CategoryNumber": 6 }, { "Question": { "Id": "48635754-41db-4194-a604-edb639910b79", "CategoryId": "24d2cfc2-d829-4173-8e75-f614966c98d2", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 86 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "48635754-41db-4194-a604-edb639910b79" }, "QuestionNumber": 10, "CategoryNumber": 6 }, { "Question": { "Id": "aa5f0554-2d69-42db-a011-a70ff5b22281", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 87 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "aa5f0554-2d69-42db-a011-a70ff5b22281" }, "QuestionNumber": 1, "CategoryNumber": 3 }, { "Question": { "Id": "27fc6b75-a6c6-40a1-98de-067804554fd7", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 88 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "27fc6b75-a6c6-40a1-98de-067804554fd7" }, "QuestionNumber": 2, "CategoryNumber": 3 }, { "Question": { "Id": "e4a85e5c-a09a-467b-bbcb-ee92882dd4f3", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 89 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "e4a85e5c-a09a-467b-bbcb-ee92882dd4f3" }, "QuestionNumber": 3, "CategoryNumber": 3 }, { "Question": { "Id": "9902f936-3fe2-4e52-99e3-82e2c505e76a", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 90 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "9902f936-3fe2-4e52-99e3-82e2c505e76a" }, "QuestionNumber": 4, "CategoryNumber": 3 }, { "Question": { "Id": "7bec2a91-e276-4169-994a-9ce3aeebb74b", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 91 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "7bec2a91-e276-4169-994a-9ce3aeebb74b" }, "QuestionNumber": 5, "CategoryNumber": 3 }, { "Question": { "Id": "7c574d0d-09c3-471a-b1ba-5fc777374242", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 92 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "7c574d0d-09c3-471a-b1ba-5fc777374242" }, "QuestionNumber": 6, "CategoryNumber": 3 }, { "Question": { "Id": "28a0312e-0531-447e-8784-ee4a1491ee41", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 93 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "28a0312e-0531-447e-8784-ee4a1491ee41" }, "QuestionNumber": 7, "CategoryNumber": 3 }, { "Question": { "Id": "2c5937c7-10af-4561-a4b9-d01e811ae4ff", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 94 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "2c5937c7-10af-4561-a4b9-d01e811ae4ff" }, "QuestionNumber": 8, "CategoryNumber": 3 }, { "Question": { "Id": "281bf227-37ae-4f44-841e-0b9fd724f9a6", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 95 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "281bf227-37ae-4f44-841e-0b9fd724f9a6" }, "QuestionNumber": 9, "CategoryNumber": 3 }, { "Question": { "Id": "464e57c1-38ad-4330-826d-61f046ae8576", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 96 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "464e57c1-38ad-4330-826d-61f046ae8576" }, "QuestionNumber": 10, "CategoryNumber": 3 }, { "Question": { "Id": "490e8bc5-ebf6-42fe-9d4a-5a15986573fc", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 97 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "490e8bc5-ebf6-42fe-9d4a-5a15986573fc" }, "QuestionNumber": 11, "CategoryNumber": 3 }, { "Question": { "Id": "0e3eaebc-31a6-415e-ba6d-3bc39e2d32f6", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 98 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "0e3eaebc-31a6-415e-ba6d-3bc39e2d32f6" }, "QuestionNumber": 12, "CategoryNumber": 3 }, { "Question": { "Id": "785ebcbc-fed8-4577-a4ce-8e346c4146c8", "CategoryId": "4ac5c341-b618-4c14-8ac4-03068e2666f4", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 99 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "785ebcbc-fed8-4577-a4ce-8e346c4146c8" }, "QuestionNumber": 13, "CategoryNumber": 3 }, { "Question": { "Id": "e829cd73-db5e-441c-8c9f-1979f2a510e9", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 100 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "e829cd73-db5e-441c-8c9f-1979f2a510e9" }, "QuestionNumber": 2, "CategoryNumber": 4 }, { "Question": { "Id": "f3220e71-f9d7-4194-99be-575d220ed57a", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 101 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "f3220e71-f9d7-4194-99be-575d220ed57a" }, "QuestionNumber": 3, "CategoryNumber": 4 }, { "Question": { "Id": "c7cdc415-58a4-43cc-8976-d16ec217900d", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 102 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c7cdc415-58a4-43cc-8976-d16ec217900d" }, "QuestionNumber": 4, "CategoryNumber": 4 }, { "Question": { "Id": "ab930606-4483-46af-a034-8ef3e3f4c4ae", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 103 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "ab930606-4483-46af-a034-8ef3e3f4c4ae" }, "QuestionNumber": 5, "CategoryNumber": 4 }, { "Question": { "Id": "eb5d9fdc-e91e-46f7-b7cc-cd11d0403b4c", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 105 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "eb5d9fdc-e91e-46f7-b7cc-cd11d0403b4c" }, "QuestionNumber": 6, "CategoryNumber": 4 }, { "Question": { "Id": "c4a38e90-0052-4389-bdce-2c8cfaab95c5", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 106 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c4a38e90-0052-4389-bdce-2c8cfaab95c5" }, "QuestionNumber": 7, "CategoryNumber": 4 }, { "Question": { "Id": "c966ba58-9a33-485b-ac81-04fd71400441", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 106 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c966ba58-9a33-485b-ac81-04fd71400441" }, "QuestionNumber": 8, "CategoryNumber": 4 }, { "Question": { "Id": "265d819c-40fd-4a9e-bfb8-21feeb3c369b", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 107 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "265d819c-40fd-4a9e-bfb8-21feeb3c369b" }, "QuestionNumber": 9, "CategoryNumber": 4 }, { "Question": { "Id": "5088c623-73ca-4f27-a1ab-84d3a2ca480b", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 108 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "5088c623-73ca-4f27-a1ab-84d3a2ca480b" }, "QuestionNumber": 10, "CategoryNumber": 4 }, { "Question": { "Id": "45092f25-b5ff-4fff-b8b5-0f9417c399cb", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 109 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "45092f25-b5ff-4fff-b8b5-0f9417c399cb" }, "QuestionNumber": 11, "CategoryNumber": 4 }, { "Question": { "Id": "d8fc0cfc-064d-4003-ae4c-bb9f32ce89a1", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 110 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "d8fc0cfc-064d-4003-ae4c-bb9f32ce89a1" }, "QuestionNumber": 12, "CategoryNumber": 4 }, { "Question": { "Id": "36513c5c-bc2a-49fd-a003-e6f8004b8447", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 111 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "36513c5c-bc2a-49fd-a003-e6f8004b8447" }, "QuestionNumber": 13, "CategoryNumber": 4 }, { "Question": { "Id": "7e75996b-c387-4219-b708-9c2c84947cb8", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 113 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "7e75996b-c387-4219-b708-9c2c84947cb8" }, "QuestionNumber": 14, "CategoryNumber": 4 }, { "Question": { "Id": "c7ec976c-10a2-48b8-ac5e-3c9b1177e351", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 114 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c7ec976c-10a2-48b8-ac5e-3c9b1177e351" }, "QuestionNumber": 15, "CategoryNumber": 4 }, { "Question": { "Id": "bf4c1b7d-80aa-40d7-afca-059399b713bb", "CategoryId": "67abf42d-53b8-41e7-805c-e2412d924e6e", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 115 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "bf4c1b7d-80aa-40d7-afca-059399b713bb" }, "QuestionNumber": 16, "CategoryNumber": 4 }, { "Question": { "Id": "14f771ba-a395-49c6-8b5a-9b69efef8bb2", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 116 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "14f771ba-a395-49c6-8b5a-9b69efef8bb2" }, "QuestionNumber": 1, "CategoryNumber": 5 }, { "Question": { "Id": "a7e112b6-beb5-47e9-89c2-b096877d7549", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 117 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "a7e112b6-beb5-47e9-89c2-b096877d7549" }, "QuestionNumber": 2, "CategoryNumber": 5 }, { "Question": { "Id": "b6456721-dcdb-4244-a407-a0cb80845bfb", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 118 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b6456721-dcdb-4244-a407-a0cb80845bfb" }, "QuestionNumber": 3, "CategoryNumber": 5 }, { "Question": { "Id": "c445c886-a3ed-4dbb-ac91-4f760cef9e03", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 119 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c445c886-a3ed-4dbb-ac91-4f760cef9e03" }, "QuestionNumber": 4, "CategoryNumber": 5 }, { "Question": { "Id": "c36f3520-07d7-486a-8e61-1c48894750fa", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 120 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c36f3520-07d7-486a-8e61-1c48894750fa" }, "QuestionNumber": 5, "CategoryNumber": 5 }, { "Question": { "Id": "6dae7926-a729-42be-815f-40917abf2b6d", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 121 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "6dae7926-a729-42be-815f-40917abf2b6d" }, "QuestionNumber": 6, "CategoryNumber": 5 }, { "Question": { "Id": "1515804c-1c64-473b-9915-0f8f575f1fdc", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 122 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "1515804c-1c64-473b-9915-0f8f575f1fdc" }, "QuestionNumber": 7, "CategoryNumber": 5 }, { "Question": { "Id": "a0d107d5-5b24-49dc-9847-9e6456b161c4", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 123 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "a0d107d5-5b24-49dc-9847-9e6456b161c4" }, "QuestionNumber": 8, "CategoryNumber": 5 }, { "Question": { "Id": "9578bd2d-757b-4637-af00-49c8edc69182", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 124 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "9578bd2d-757b-4637-af00-49c8edc69182" }, "QuestionNumber": 9, "CategoryNumber": 5 }, { "Question": { "Id": "d1dabe7c-b647-40dc-98b0-3495326ff609", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 125 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "d1dabe7c-b647-40dc-98b0-3495326ff609" }, "QuestionNumber": 10, "CategoryNumber": 5 }, { "Question": { "Id": "4d5bdf04-7c2f-4a1c-a956-e32d324f9be8", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 126 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "4d5bdf04-7c2f-4a1c-a956-e32d324f9be8" }, "QuestionNumber": 11, "CategoryNumber": 5 }, { "Question": { "Id": "b3d47c1e-68dc-48f7-ad88-74209cfec08e", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 127 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b3d47c1e-68dc-48f7-ad88-74209cfec08e" }, "QuestionNumber": 12, "CategoryNumber": 5 }, { "Question": { "Id": "eede7a90-0000-4f5d-b784-e112afe0d2e3", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 128 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "eede7a90-0000-4f5d-b784-e112afe0d2e3" }, "QuestionNumber": 13, "CategoryNumber": 5 }, { "Question": { "Id": "5158ccab-f085-4d3c-b50c-c960716df215", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 129 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "5158ccab-f085-4d3c-b50c-c960716df215" }, "QuestionNumber": 14, "CategoryNumber": 5 }, { "Question": { "Id": "cc6a0381-6605-4e01-8620-10b3e17a992f", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 130 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "cc6a0381-6605-4e01-8620-10b3e17a992f" }, "QuestionNumber": 15, "CategoryNumber": 5 }, { "Question": { "Id": "790562de-217c-4ba8-9e8b-ff7a4c858031", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 131 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "790562de-217c-4ba8-9e8b-ff7a4c858031" }, "QuestionNumber": 16, "CategoryNumber": 5 }, { "Question": { "Id": "7c84eb43-fc9d-488f-8c04-d5386048d679", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 133 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "7c84eb43-fc9d-488f-8c04-d5386048d679" }, "QuestionNumber": 17, "CategoryNumber": 5 }, { "Question": { "Id": "9bbe4d97-dfea-4e46-9e5d-48d04d129bde", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 134 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "9bbe4d97-dfea-4e46-9e5d-48d04d129bde" }, "QuestionNumber": 18, "CategoryNumber": 5 }, { "Question": { "Id": "b2f93d98-4cd4-437c-b3c5-2824b3c98769", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 136 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b2f93d98-4cd4-437c-b3c5-2824b3c98769" }, "QuestionNumber": 19, "CategoryNumber": 5 }, { "Question": { "Id": "09ceba46-e188-4137-800c-cdbb04c59fe7", "CategoryId": "be90fefb-400b-475e-ada6-8ccfed57e0d0", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 137 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "09ceba46-e188-4137-800c-cdbb04c59fe7" }, "QuestionNumber": 20, "CategoryNumber": 5 }, { "Question": { "Id": "61e49d3e-7dff-4fb8-8a46-9576231f6c71", "CategoryId": "3755dc4d-af28-4c03-a3a0-89ad5b76e26a", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 141 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "61e49d3e-7dff-4fb8-8a46-9576231f6c71" }, "QuestionNumber": 1, "CategoryNumber": 2 }, { "Question": { "Id": "c3f14ec6-100e-4a44-9575-d1ca506782f8", "CategoryId": "3755dc4d-af28-4c03-a3a0-89ad5b76e26a", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 142 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c3f14ec6-100e-4a44-9575-d1ca506782f8" }, "QuestionNumber": 2, "CategoryNumber": 2 }, { "Question": { "Id": "c1dfdcac-7ab7-4333-97e4-d3f3bdf584d8", "CategoryId": "3755dc4d-af28-4c03-a3a0-89ad5b76e26a", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 155 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c1dfdcac-7ab7-4333-97e4-d3f3bdf584d8" }, "QuestionNumber": 3, "CategoryNumber": 2 }, { "Question": { "Id": "5db15c06-0527-40d8-9396-2e635ac060b3", "CategoryId": "3755dc4d-af28-4c03-a3a0-89ad5b76e26a", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 159 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "5db15c06-0527-40d8-9396-2e635ac060b3" }, "QuestionNumber": 4, "CategoryNumber": 2 }, { "Question": { "Id": "42c52400-bfda-4b56-b6b9-79cd025c20e0", "CategoryId": "3755dc4d-af28-4c03-a3a0-89ad5b76e26a", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 160 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "42c52400-bfda-4b56-b6b9-79cd025c20e0" }, "QuestionNumber": 5, "CategoryNumber": 2 }, { "Question": { "Id": "99437801-9993-4c75-94a6-fa8cfa46d3c7", "CategoryId": "3755dc4d-af28-4c03-a3a0-89ad5b76e26a", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 161 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "99437801-9993-4c75-94a6-fa8cfa46d3c7" }, "QuestionNumber": 6, "CategoryNumber": 2 }, { "Question": { "Id": "1ebe5a78-f4ad-4313-a4aa-806fd09fc597", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 162 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "1ebe5a78-f4ad-4313-a4aa-806fd09fc597" }, "QuestionNumber": 1, "CategoryNumber": 8 }, { "Question": { "Id": "3524dc04-33ae-4fe0-8c93-5e042ab8637f", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 163 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "3524dc04-33ae-4fe0-8c93-5e042ab8637f" }, "QuestionNumber": 2, "CategoryNumber": 8 }, { "Question": { "Id": "a64b340a-1fa6-4946-a61e-313a70992d55", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 164 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "a64b340a-1fa6-4946-a61e-313a70992d55" }, "QuestionNumber": 3, "CategoryNumber": 8 }, { "Question": { "Id": "b948faf8-abd4-4976-966d-d0f7199dac54", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 165 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b948faf8-abd4-4976-966d-d0f7199dac54" }, "QuestionNumber": 4, "CategoryNumber": 8 }, { "Question": { "Id": "c798f390-0ce0-4a02-a1c8-cc8c16ba78b2", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 166 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c798f390-0ce0-4a02-a1c8-cc8c16ba78b2" }, "QuestionNumber": 5, "CategoryNumber": 8 }, { "Question": { "Id": "5923cc77-5486-4a8d-bae2-bdb2e7ab5f6d", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 167 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "5923cc77-5486-4a8d-bae2-bdb2e7ab5f6d" }, "QuestionNumber": 6, "CategoryNumber": 8 }, { "Question": { "Id": "32c87c36-4c5e-4696-9d83-1a68688cb9e9", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 168 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "32c87c36-4c5e-4696-9d83-1a68688cb9e9" }, "QuestionNumber": 7, "CategoryNumber": 8 }, { "Question": { "Id": "5520de9a-0e3c-491a-89cc-198957320fe5", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 169 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "5520de9a-0e3c-491a-89cc-198957320fe5" }, "QuestionNumber": 8, "CategoryNumber": 8 }, { "Question": { "Id": "443e283b-a96c-4da8-948d-51d5623bda8b", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 170 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "443e283b-a96c-4da8-948d-51d5623bda8b" }, "QuestionNumber": 9, "CategoryNumber": 8 }, { "Question": { "Id": "b9acf6a4-d024-42f1-87aa-615952299156", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 171 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b9acf6a4-d024-42f1-87aa-615952299156" }, "QuestionNumber": 10, "CategoryNumber": 8 }, { "Question": { "Id": "e21d8a83-3802-4f8e-9275-798aa9b96c0b", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 172 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "e21d8a83-3802-4f8e-9275-798aa9b96c0b" }, "QuestionNumber": 11, "CategoryNumber": 8 }, { "Question": { "Id": "b2e2c260-8f39-466d-9292-aa35d1224060", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 173 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b2e2c260-8f39-466d-9292-aa35d1224060" }, "QuestionNumber": 12, "CategoryNumber": 8 }, { "Question": { "Id": "f2d4512c-e950-4692-99aa-63e7c79f70b2", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 173 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "f2d4512c-e950-4692-99aa-63e7c79f70b2" }, "QuestionNumber": 13, "CategoryNumber": 8 }, { "Question": { "Id": "e643b157-7658-4e9d-a9d4-fd5f1566a18e", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 174 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "e643b157-7658-4e9d-a9d4-fd5f1566a18e" }, "QuestionNumber": 14, "CategoryNumber": 8 }, { "Question": { "Id": "7f71d22e-65b5-4a75-aac6-6cf8af348dbf", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 175 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "7f71d22e-65b5-4a75-aac6-6cf8af348dbf" }, "QuestionNumber": 15, "CategoryNumber": 8 }, { "Question": { "Id": "6cec8e7a-a86c-44c7-9cd7-bd5f4b2341c1", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 176 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "6cec8e7a-a86c-44c7-9cd7-bd5f4b2341c1" }, "QuestionNumber": 16, "CategoryNumber": 8 }, { "Question": { "Id": "9454f136-4d72-4581-a736-99b9b0275e8d", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 177 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "9454f136-4d72-4581-a736-99b9b0275e8d" }, "QuestionNumber": 17, "CategoryNumber": 8 }, { "Question": { "Id": "30f773fb-7e73-4dc2-8e35-bd15b8803f43", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 178 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "30f773fb-7e73-4dc2-8e35-bd15b8803f43" }, "QuestionNumber": 18, "CategoryNumber": 8 }, { "Question": { "Id": "8016c751-e1dd-4459-8434-a8c2226ba4cd", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 179 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "8016c751-e1dd-4459-8434-a8c2226ba4cd" }, "QuestionNumber": 19, "CategoryNumber": 8 }, { "Question": { "Id": "3eecba08-fec0-48c9-81a7-85a4bfd3e1cd", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 180 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "3eecba08-fec0-48c9-81a7-85a4bfd3e1cd" }, "QuestionNumber": 20, "CategoryNumber": 8 }, { "Question": { "Id": "7b558f0a-c8cc-4716-9b8b-dce561f8e25a", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 181 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "7b558f0a-c8cc-4716-9b8b-dce561f8e25a" }, "QuestionNumber": 21, "CategoryNumber": 8 }, { "Question": { "Id": "db3ee9a7-36b0-4069-8f66-401ad56758fc", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 182 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "db3ee9a7-36b0-4069-8f66-401ad56758fc" }, "QuestionNumber": 22, "CategoryNumber": 8 }, { "Question": { "Id": "126ce1ec-2c59-4c1a-b8fd-fa8c97c977ca", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 183 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "126ce1ec-2c59-4c1a-b8fd-fa8c97c977ca" }, "QuestionNumber": 23, "CategoryNumber": 8 }, { "Question": { "Id": "2bd70670-241c-450b-95c2-bd2012d2e259", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 184 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "2bd70670-241c-450b-95c2-bd2012d2e259" }, "QuestionNumber": 24, "CategoryNumber": 8 }, { "Question": { "Id": "f7931009-2c69-47a6-a968-04969d93d8cd", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 185 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "f7931009-2c69-47a6-a968-04969d93d8cd" }, "QuestionNumber": 25, "CategoryNumber": 8 }, { "Question": { "Id": "d97e3517-e7d1-4ddf-9e7d-53b6d7678836", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 186 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "d97e3517-e7d1-4ddf-9e7d-53b6d7678836" }, "QuestionNumber": 26, "CategoryNumber": 8 }, { "Question": { "Id": "e2d2d056-8865-4434-8a9c-534b4bfe0c7b", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 187 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "e2d2d056-8865-4434-8a9c-534b4bfe0c7b" }, "QuestionNumber": 27, "CategoryNumber": 8 }, { "Question": { "Id": "cf5ad56d-f64a-49f0-99a5-34b47632bbde", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 188 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "cf5ad56d-f64a-49f0-99a5-34b47632bbde" }, "QuestionNumber": 28, "CategoryNumber": 8 }, { "Question": { "Id": "b15f4ac6-8069-45db-943f-e4657fa7c8cc", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 189 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "b15f4ac6-8069-45db-943f-e4657fa7c8cc" }, "QuestionNumber": 29, "CategoryNumber": 8 }, { "Question": { "Id": "c2857f5e-bafd-4fe5-bdbb-3e8df29667ed", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 189 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c2857f5e-bafd-4fe5-bdbb-3e8df29667ed" }, "QuestionNumber": 30, "CategoryNumber": 8 }, { "Question": { "Id": "fe64b1de-d13c-4468-9296-9b0b517fb954", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 190 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "fe64b1de-d13c-4468-9296-9b0b517fb954" }, "QuestionNumber": 31, "CategoryNumber": 8 }, { "Question": { "Id": "ba73f28b-384f-40ad-ab4d-1ba5230c9236", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 191 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "ba73f28b-384f-40ad-ab4d-1ba5230c9236" }, "QuestionNumber": 32, "CategoryNumber": 8 }, { "Question": { "Id": "407404c3-5c98-4271-bd85-8f73b12193b2", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 196 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "407404c3-5c98-4271-bd85-8f73b12193b2" }, "QuestionNumber": 33, "CategoryNumber": 8 }, { "Question": { "Id": "1ec44beb-3183-486c-af30-20c79f4bb241", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 198 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "1ec44beb-3183-486c-af30-20c79f4bb241" }, "QuestionNumber": 34, "CategoryNumber": 8 }, { "Question": { "Id": "80c56502-91be-475f-a008-2b0a3853cfbf", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 200 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "80c56502-91be-475f-a008-2b0a3853cfbf" }, "QuestionNumber": 35, "CategoryNumber": 8 }, { "Question": { "Id": "c91f2b6a-d6d4-4818-884c-01bc9a6bdd55", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 202 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "c91f2b6a-d6d4-4818-884c-01bc9a6bdd55" }, "QuestionNumber": 36, "CategoryNumber": 8 }, { "Question": { "Id": "88d2b973-6e83-4a05-817e-3ae2de094b87", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 203 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "88d2b973-6e83-4a05-817e-3ae2de094b87" }, "QuestionNumber": 37, "CategoryNumber": 8 }, { "Question": { "Id": "47e19c63-ece5-4711-8eaa-566cd175b7a6", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 204 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "47e19c63-ece5-4711-8eaa-566cd175b7a6" }, "QuestionNumber": 38, "CategoryNumber": 8 }, { "Question": { "Id": "425b1c69-6d6d-4475-8561-a2d00a1ae135", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 205 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "425b1c69-6d6d-4475-8561-a2d00a1ae135" }, "QuestionNumber": 39, "CategoryNumber": 8 }, { "Question": { "Id": "6f2dbd8d-b2af-4fc4-89f6-16bc40da8ec0", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 206 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "6f2dbd8d-b2af-4fc4-89f6-16bc40da8ec0" }, "QuestionNumber": 40, "CategoryNumber": 8 }, { "Question": { "Id": "cdf0ec95-502c-4a0f-87e0-f49bc1e5fcb9", "CategoryId": "097b45db-450b-4040-b365-ddc9aaf709fe", "Mandatory": true, "SpecificToClientId": null, "OrderNumber": 207 }, "Answer": { "Id": null, "SelectedResponseId": null, "Comment": "", "QuestionId": "cdf0ec95-502c-4a0f-87e0-f49bc1e5fcb9" }, "QuestionNumber": 41, "CategoryNumber": 8 }], "SiteVisit": { "VisitDate": "01/11/2013", "PersonSeen": {} }, "Status": "Draft", "CreatedOn": "2013-11-12T11:28:57.973Z", "CreatedBy": "Scott Gilhooly", "Industry": "Complete set of questions"
            };

    it('given checklists are stored locally when i query checklist then status from the server is displayed', function () {
        //given
        var checklist = checklistService.create(111, 222);
        checklist.LastModifiedOn = new Date('2013-11-25T10:18:44');
        var checklistId = checklist.Id;
        checklist.Status = "Not this status";
        checklistService.saveToLocalStorage(checklist);
        var expectedStatus = "Assigned";
        var expectedQAAdvisor = { "Id": "5ec4ce8c-c7b3-48f0-b0ae-a981736dbbe5", "Forename": "Andrew", "Surname": null, "Email": "Andrew.Burgess@peninsula-uk.com", "Fullname": "Andrew Burgess", "Initials": "Andrew B" };

        var checklistsFromServer = [{ "Id": checklistId, "Title": "Title", "CreatedOn": "2013-11-25T10:18:44", "CreatedBy": "Alastair Polden", "VisitBy": "", "Status": expectedStatus, "VisitDate": "2013-11-30T00:00:00", "ClientName": null, "CAN": "DEN101", "QaAdvisor": expectedQAAdvisor, "HasQaComments": false, "Deleted": false }];
        $httpBackend.whenGET(/\/api\/checklistsquery.*/i).respond(checklistsFromServer);
        $httpBackend.whenGET("api/checklistsquery?clientAccountNumber=&checklistCreatedBy=&visitDate=&status=&includeDeleted=false&excludeSubmitted=false&statusFromDate=&statusToDate=").respond(checklistsFromServer);

        //when
        var result = [];
        checklistService.query("", "", "", "", false, false,"","", function (data) {
            result = data;
        });
        $httpBackend.flush();

        //THEN
        var checklists = $filter('filter')(result, { "Id": checklistId });
        expect(checklists.length).toBeGreaterThan(0);
        expect(checklists[0].Status).toBe(expectedStatus);
        expect(checklists[0].QaAdvisor).toBeDefined;
        expect(checklists[0].QaAdvisor).toBe(expectedQAAdvisor);

        //CLEAN UP
        localStorage.removeItem("Checklist." + checklistId);
    });

    it('Given i have a completed checklist when successfuly saved to server then checklist is removed from local storage', function () {
        //given
        var checklist = createChecklist();
        checklist.Status = "Completed";
        $httpBackend.whenPOST(config.apiUrl + 'checklists/' + checklist.Id).respond({ "LastModifiedOn": new Date('2013-11-25T10:18:44') });

        //when
        checklistService.save(checklist);
        $httpBackend.flush();


        //Assert
        expect(localStorage.getItem("Checklist." + checklistId)).toBeNull();
    });
    
    it('Given i have a draft checklist when successfuly saved to server then checklist is saved to local storage', function () {
        //given
        var checklist = createChecklist();
        checklist.Status = "Draft";
        $httpBackend.whenPOST(config.apiUrl + 'checklists/' + checklist.Id).respond({ "LastModifiedOn": new Date('2013-11-25T10:18:44') });

        //when
        checklistService.save(checklist);
        $httpBackend.flush();


        //Assert
                expect(localStorage.getItem("Checklist." + checklistId)).not.toBeNull();
    });

    xit('Given i have a completed checklist when save to server ERROR then checklist is saved to local storage', function () {
        //given
        var checklist = createChecklist();
        checklist.Status = "Completed";
        $httpBackend.whenPOST(config.apiUrl + 'checklists/' + checklist.Id).respond(500);

        //when
        checklistService.save(checklist);
        $httpBackend.flush();
        
        waitsFor(function() {
            return localStorage.getItem("Checklist." + checklistId) != null;
        }, 500);
       
         //Assert
            expect(localStorage.getItem("Checklist." + checklistId)).not.toBeNull();
    });
    
    it('Given i have a template question Ids then get complete question for each Id in list', function () {
        
        //when
        var questionsArray = [];
        
        var item0 = "f9b5db39-d7e4-4fea-baae-0098b6a94684";
        var item1 = "4b55802f-bf90-4732-a941-04d074c98e33";
        var item2 = "ccc5db39-d7e4-4fea-baae-0098b6a94684";
        
        questionsArray.push(item0);
        questionsArray.push(item1);
        questionsArray.push(item2);
        
        //given
        var questions = checklistService.getQuestionsByQuestionsArrayId(getCompleteSetOfQuestionsArray(), questionsArray);
        
         //Assert
        expect(questions.length).toEqual(2);
        expect(questions[0].Id).toEqual(item0);
        expect(questions[1].Id).toEqual(item1);
    });

    
});



