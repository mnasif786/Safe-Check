using System.Web.Mvc;
using System.Web.Http;
using System.Web.Routing;

namespace EvaluationChecklist.App_Start
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            AddRoutesForChecklistController(config);
            AddRoutesForConsultantController(config);

            config.Routes.MapHttpRoute(
                name: "ActionApi1",
                routeTemplate: "SpellCheck",
                defaults: new {controller = "SpellCheck", action = "Post"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")}
                );

            config.Routes.MapHttpRoute(
                name: "ActionApi2",
                routeTemplate: "SpellCheck",
                defaults: new {controller = "SpellCheck", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")}
                );

            config.Routes.MapHttpRoute(
                name: "Account",
                routeTemplate: "Account",
                defaults: new {controller = "Account", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")}
                );



            config.Routes.MapHttpRoute(
                name: "GetQuestionNextOrderNumber",
                routeTemplate: "api/question/getQuestionNextOrderNumber",
                defaults: new {controller = "Question", action = "GetQuestionNextOrderNumber"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "Questions",
                routeTemplate: "api/questions",
                defaults: new {controller = "Question", action = "GetALLQuestions"});

            config.Routes.MapHttpRoute(
                name: "ClientQuestions",
                routeTemplate: "api/client/{id}/questions",
                defaults: new {controller = "Question", action = "GetQuestionsByClient"});

            config.Routes.MapHttpRoute(
                name: "AllClientQuestions",
                routeTemplate: "api/client/questions",
                defaults: new {controller = "Question", action = "GetAllClientQuestions"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "UpdateQuestionOrder",
                routeTemplate: "api/question/questionorder",
                defaults: new {controller = "Question", action = "UpdateQuestionOrder"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "PostQuestion",
                routeTemplate: "api/question/{id}",
                defaults: new {controller = "Question", action = "PostQuestion", id = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "GetQuestion",
                routeTemplate: "api/question/{id}",
                defaults: new {controller = "Question", action = "Get", id = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "QuestionHeadings",
                routeTemplate: "api/headings",
                defaults: new {controller = "Question", action = "GetAreaOfNonComplianceHeadings"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "Categories",
                routeTemplate: "api/categories",
                defaults: new {controller = "Category", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "CategoryList",
                routeTemplate: "api/categorylist",
                defaults: new {controller = "Category", action = "GetCategoryList"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "CategoriesOptions",
                routeTemplate: "api/categories",
                defaults: new {controller = "Category", action = "Options"}
                , constraints: new {httpMethod = new HttpMethodConstraint("Options")});

            config.Routes.MapHttpRoute(
                name: "ClientByCAN",
                routeTemplate: "api/clients/query/{clientAccountNumber}",
                defaults: new {controller = "Client", action = "Query"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "EmployyesByClient",
                routeTemplate: "api/clients/{clientId}/Employees",
                defaults: new {controller = "Client", action = "GetEmployees"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "ClientById",
                routeTemplate: "api/clients/{id}",
                defaults: new {controller = "Client", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "ClientByIdOPTIONS",
                routeTemplate: "api/clients/{id}",
                defaults: new {controller = "Client", action = "Options"}
                , constraints: new {httpMethod = new HttpMethodConstraint("OPTIONS")});

            
            

            config.Routes.MapHttpRoute(
                name: "UpdatePDF",
                routeTemplate: "api/reports/update/pdf/{id}",
                defaults: new {controller = "Checklist", action = "UpdatePDF", id = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});


            config.Routes.MapHttpRoute(
                name: "QueryChecklists",
                routeTemplate: "api/checklistsquery",
                defaults: new {controller = "Checklist", action = "Query"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});
   
            config.Routes.MapHttpRoute(
                name: "GetChecklistsByClientId",
                routeTemplate: "api/clients/{clientId}/checklists",
                defaults: new {controller = "Checklist", action = "GetByClientId"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "GetChecklistsByClientIdOPTIONS",
                routeTemplate: "api/clients/{clientId}/checklists",
                defaults: new {controller = "Checklist", action = "Options"}
                , constraints: new {httpMethod = new HttpMethodConstraint("OPTIONS")});

            config.Routes.MapHttpRoute(
                name: "Industries",
                routeTemplate: "api/industries",
                defaults: new {controller = "Industry", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "CloneIndustry",
                routeTemplate: "api/template/clone",
                defaults: new {controller = "ChecklistTemplate", action = "Clone"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "DeleteTemplate",
                routeTemplate: "api/template/deletetemplate/{id}",
                defaults: new {controller = "ChecklistTemplate", action = "DeleteTemplate", id = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "RenameIndustry",
                routeTemplate: "api/template/rename",
                defaults: new {controller = "ChecklistTemplate", action = "Rename"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "UpdateTemplateQuestion",
                routeTemplate: "api/template/updatequestion",
                defaults: new {controller = "ChecklistTemplate", action = "UpdateTemplateQuestion"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "GetChecklistTemplates",
                routeTemplate: "api/checklisttemplate/",
                defaults: new {controller = "ChecklistTemplate", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "GetChecklistTemplatesWithQuestionId",
                routeTemplate: "api/checklisttemplate/GetWithQuestionIds",
                defaults: new {controller = "ChecklistTemplate", action = "GetWithQuestionIds"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "GetChecklistTemplate",
                routeTemplate: "api/checklisttemplate/{id}",
                defaults: new {controller = "ChecklistTemplate", action = "GetById"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "GetTemplateName",
                routeTemplate: "api/template/{id}/name",
                defaults: new {controller = "ChecklistTemplate", action = "GetTemplateName"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "IndustriesForQuestion",
                routeTemplate: "api/industries/{questionId}",
                defaults: new {controller = "Industry", action = "GetIndustriesByQuestionId"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "IndustryQuestions",
                routeTemplate: "api/industryquestions",
                defaults: new {controller = "Industry", action = "UpdateIndustryQuestions"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "UpdateIndustry",
                routeTemplate: "api/industries",
                defaults: new {controller = "Industry", action = "UpdateIndustry"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "IndustriesOptions",
                routeTemplate: "api/industries",
                defaults: new {controller = "Industry", action = "Options"}
                , constraints: new {httpMethod = new HttpMethodConstraint("OPTIONS")});


            config.Routes.MapHttpRoute(
                name: "Advisors",
                routeTemplate: "api/advisors",
                defaults: new {controller = "QaAdvisor", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "AdvisorsPost",
                routeTemplate: "api/advisors",
                defaults: new {controller = "QaAdvisor", action = "Post"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "GetNextAdvisorInRotation",
                routeTemplate: "api/advisors/nextQaAdvisorInRotation",
                defaults: new {controller = "QaAdvisor", action = "GetNextQaAdvisorInRotation"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "GetPreviousAdvisorInRotation",
                routeTemplate: "api/advisors/previousQaAdvisorInRotation",
                defaults: new {controller = "QaAdvisor", action = "GetPreviousQaAdvisorInRotation"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});


            config.Routes.MapHttpRoute(
                name: "CompleteSetOfQuestions",
                routeTemplate: "api/completesetofquestions",
                defaults: new {controller = "Question", action = "GetCompleteSetOfQuestions"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "GetImpressionTypes",
                routeTemplate: "api/impressions",
                defaults: new {controller = "Checklist", action = "GetImpressionTypes"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});


            config.Routes.MapHttpRoute(
                name: "SendUpdateRequiredEmailNotification",
                routeTemplate: "api/updaterequirenotification/checklist/{id}",
                defaults: new {controller = "Checklist", action = "SendUpdateRequiredEmailNotification", id = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});


            config.Routes.MapHttpRoute(
                name: "GetExecutiveSummaryForChecklist",
                routeTemplate: "api/summary/{checklistId}",
                defaults: new {controller = "Checklist", action = "GetExecutiveSummaryForChecklist"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});





            config.Routes.MapHttpRoute(
                name: "MaintenanceUserController",
                routeTemplate: "api/maintenanceuser",
                defaults: new {controller = "MaintenanceUser", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});




            RouteTable.Routes.MapRoute("ActionPlanHTML", "api/reports/actionplan",
                new {controller = "Document", action = "ActionPlan", returnUrl = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            RouteTable.Routes.MapRoute("ComplianceReviewPDF", "api/reports/actionplan/pdf",
                new {controller = "Document", action = "CreateComplianceReviewPDF", returnUrl = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            RouteTable.Routes.MapRoute("ClientPreviewPDF", "api/reports/clientpreview/pdf",
                new {controller = "Document", action = "CreateClientPreviewPDF", returnUrl = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            RouteTable.Routes.MapRoute("AllQuestionsPDF", "api/reports/allquestions/pdf",
            new { controller = "Document", action = "CreateAllQuestionsPDF", returnUrl = UrlParameter.Optional }
            , constraints: new { httpMethod = new HttpMethodConstraint("POST") });


            RouteTable.Routes.MapRoute("ExecutiveSummaryHTML", "api/reports/executivesummary",
                new {controller = "Document", action = "ExecutiveSummary", returnUrl = UrlParameter.Optional});

            RouteTable.Routes.MapRoute("ActionPlanPDF", "api/reports/actionplanpdf",
                new {controller = "Document", action = "CreateActionPlanPDF", returnUrl = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            

        }

        private static void AddRoutesForConsultantController(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "GetConsultants",
                routeTemplate: "api/consultants",
                defaults: new {controller = "Consultant", action = "Get"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "PostConsultants",
                routeTemplate: "api/consultants",
                defaults: new {controller = "Consultant", action = "Post"}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "DeleteConsultants",
                routeTemplate: "api/consultants/{id}",
                defaults: new {controller = "Consultant", action = "Delete"}
                , constraints: new {httpMethod = new HttpMethodConstraint("DELETE")});

            config.Routes.MapHttpRoute(
                name: "CreateConsultants",
                routeTemplate: "api/consultants/{username}",
                defaults: new {controller = "Consultant", action = "Put"}
                , constraints: new {httpMethod = new HttpMethodConstraint("PUT")});
        }

        private static void AddRoutesForChecklistController(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "DeleteChecklist",
                routeTemplate: "api/deletechecklist/{id}",
                defaults: new {controller = "Checklist", action = "DeleteChecklist", id = UrlParameter.Optional},
                constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "Checklist",
                routeTemplate: "api/checklists/{id}",
                defaults: new {controller = "Checklist", action = "GetChecklist"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "PostChecklist",
                routeTemplate: "api/checklists/{id}",
                defaults: new {controller = "Checklist", action = "PostChecklist", id = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "ChecklistGetDistinctCreatedBy",
                routeTemplate: "api/checklist/getdistinctcreatedby",
                defaults: new {controller = "Checklist", action = "GetDistinctCreatedBy"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "ChecklistGetLastModifiedOn",
                routeTemplate: "api/checklist/{id}/getlastmodifiedon",
                defaults: new {controller = "Checklist", action = "GetLastModifiedOn"}
                , constraints: new {httpMethod = new HttpMethodConstraint("GET")});

            config.Routes.MapHttpRoute(
                name: "AssignChecklistToQaAdvisor",
                routeTemplate: "api/checklist/{id}/AssignChecklistToQaAdvisor",
                defaults: new {controller = "Checklist", action = "AssignChecklistToQaAdvisor", id = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "SendChecklistCompleteEmailNotification",
                routeTemplate: "api/checklists/SendChecklistCompleteEmailNotification/{id}",
                defaults: new {controller = "Checklist", action = "SendChecklistCompleteEmailNotification", id = UrlParameter.Optional}
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
                name: "CopyChecklistWithoutResponses",
                routeTemplate: "api/checklist/{checklistId}/copywithoutresponses/{clientId}/{isClone}",
                defaults: new { controller = "Checklist", action = "CopyToSiteWithoutResponses" }
                , constraints: new {httpMethod = new HttpMethodConstraint("POST")});

            config.Routes.MapHttpRoute(
               name: "CopyChecklistWithResponses",
               routeTemplate: "api/checklist/{checklistId}/copywithresponses/{clientId}/{isClone}",
               defaults: new { controller = "Checklist", action = "CopyToSiteWithResponses" }
               , constraints: new { httpMethod = new HttpMethodConstraint("POST") });

            config.Routes.MapHttpRoute(
               name: "MarkChecklistFavourite",
               routeTemplate: "api/checklist/{checklistId}/markchecklistfavourite",
               defaults: new { controller = "Checklist", action = "MarkChecklistAsFavourite" }
               , constraints: new { httpMethod = new HttpMethodConstraint("POST") });

            config.Routes.MapHttpRoute(
               name: "UnMarkChecklistFavourite",
               routeTemplate: "api/checklist/{checklistId}/unmarkchecklistfavourite",
               defaults: new { controller = "Checklist", action = "UnMarkChecklistAsFavourite" }
               , constraints: new { httpMethod = new HttpMethodConstraint("POST") });

            config.Routes.MapHttpRoute(
               name: "SearchFavouriteChecklists",
               routeTemplate: "api/checklist/searchfavouritechecklists",
               defaults: new { controller = "Checklist", action = "SearchFavourites" }
               , constraints: new { httpMethod = new HttpMethodConstraint("GET") });

            config.Routes.MapHttpRoute(
              name: "RestoreDeletedChecklist",
              routeTemplate: "api/checklist/{checklistId}/restoredeletedchecklist",
              defaults: new { controller = "Checklist", action = "RestoreDeletedChecklist" }
              , constraints: new { httpMethod = new HttpMethodConstraint("POST") });

            config.Routes.MapHttpRoute(
              name: "RevertChecklist",
              routeTemplate: "api/checklist/{checklistId}/revertchecklist",
              defaults: new { controller = "Checklist", action = "RevertChecklist" }
              , constraints: new { httpMethod = new HttpMethodConstraint("POST") });


        }
    }
}