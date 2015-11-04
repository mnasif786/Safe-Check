var SafecheckObjectFactory = SafecheckObjectFactory || {};

SafecheckObjectFactory.createChecklist = function() {
    return {
        "Id": "f1987c56-35a7-c7f3-fa22-a0f7b594e55c",
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
                            "SupportingEvidence": "",
                            "ActionRequired": "",
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
                    "PossibleResponses": [
                    ],
                    "Mandatory": true
                },
                "Answer": {
                    "Id": "f60026ad-f705-4c1c-a1bc-891934ded013",
                    "SelectedResponseId": null,
                    "SupportingEvidence": "",
                    "ActionRequired": "",
                    "QuestionId": "1ea8c779-c3ef-48a7-8a17-1bdaec49fbf6"
                }
            }
        ],
        "SiteVisit": { "SelectedImpressionType": null,"EmailAddress": null },
        "EmailReportToPerson": false,
        "EmailReportToOthers": false,
        "OtherEmails": [],
        "PersonsSeen": [],
        "Status": null
    };

};

SafecheckObjectFactory.createOtherEmail = function() {
    return {
        "Id": guid(),
        "EmailAddress": ""
    };
};

SafecheckObjectFactory.createPersonSeen = function() {
    return { "Id": guid(), "EmployeeId": null, "FullName": null, "EmailAddress": null };
};

SafecheckObjectFactory.createClientDetails = function() {
    return {
        "Id": 33749,
        "CompanyName": "Fat Face Ltd",
        "CAN": "FAT04",
        "Contacts": [
        ],
        "Sites": [
            {
                "Checklist": {
                    "Id": null,
                    "CreatedOn": null,
                    "CreatedBy": "",
                    "VisitDate": null,
                    "VisitBy": "",
                    "Status": ""
                },
                "Id": 432845,
                "SiteName": "Fat Face Ltd",
                "Address1": "14 Butchery Lane",
                "Address2": "Canterbury",
                "Address3": null,
                "Address4": null,
                "Address5": null,
                "County": null,
                "Postcode": "CT1 2JR",
                "Telephone": "01227379926",
                "Fax": null,
                "SiteContact": null,
                "IsMainSite": false
            }
        ]
    };
};

SafecheckObjectFactory.createQuestion = function () {
    return {
        "Id": guid(),
        "Text": "Has each pressure system been subject to a written scheme of examination?",
        "PossibleResponses": [],
        "CategoryId": "2efb7c62-e57a-4e7a-b712-06d143fc9383",
        "Category": {
            "Id": "2efb7c62-e57a-4e7a-b712-06d143fc9383",
            "Title": "Documentation",
            "Questions": [],
            "OrderNumber": 1,
            "TabTitle": "DOCS"
        },
        "Mandatory": true,
        "SpecificToClientId": null,
        "OrderNumber": 0,
        "Deleted": false
    };
};

SafecheckObjectFactory.createQuestionAnswer = function () {
    return {
        "Question": {
            "Id": guid(),
            "PossibleResponses": [
            ]
        },
        "Answer": {
            "Id": guid(),
            "SelectedResponseId": null,
            "SupportingEvidence": "",
            "ActionRequired": "",
            "Response": { "ResponseType": "" },
            "QaComments": null,
            "QaSignedOffBy": null,
            "QaSignedOffDate": null,
            "QaCommentsResolved": null
        }
    };
};

SafecheckObjectFactory.createEmployee = function () {
    return {
        "Id": guid(),
        "FullName": null,
        "EmailAddress": null,
        "Forename": null,
        "Surname": null
    };
};
