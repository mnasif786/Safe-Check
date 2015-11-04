using System;
using System.Web;
using System.Web.Mvc;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using StructureMap;
using log4net;

namespace EvaluationChecklist.Controllers
{
    [Authorize]
    public class DocumentController : Controller
    {
        private readonly IComplianceReviewReportViewModelFactory _complianceReviewReportViewModelFactory;

        public DocumentController()
        {
            _complianceReviewReportViewModelFactory =
                ObjectFactory.GetInstance<ComplianceReviewReportViewModelFactory>();
        }

        [HttpPost, ValidateInput(false)]
        public ActionResult ActionPlan(ChecklistViewModel model)
        {
            return View("ActionPlan", _complianceReviewReportViewModelFactory.GetViewModel(model));
        }

        /// <summary>
        /// Create PDF version of report, always including  Action plan and Compliance review
        /// </summary>
        /// <param name="checklist">json value of the checklist model</param>
        [HttpPost, ValidateInput(false)]
        public void CreateComplianceReviewPDF(string checklist)
        {
            try
            {
                var model = Newtonsoft.Json.JsonConvert.DeserializeObject<ChecklistViewModel>(checklist);

                // Always return all elements of report
                model.IncludeActionPlan = true;
                model.IncludeComplianceReview = true;
                model.AllQuestionTemplate = false;

                CreateComplianceReviewPDF(model, "ComplianceReview.pdf");    
            }
            catch(Exception ex)
            {
                LogManager.GetLogger(typeof(DocumentController)).Error(ex);
                throw;
            }            
        }
     

        /// <summary>
        /// Create PDF version of report, optionally including Action plan and Compliance review
        /// </summary>
        /// <param name="checklist">json value of the checklist model</param>
        [HttpPost, ValidateInput(false)]
        public void CreateClientPreviewPDF(string checklist)
        {
            try
            {
                var model = Newtonsoft.Json.JsonConvert.DeserializeObject<ChecklistViewModel>(checklist);

                model.AllQuestionTemplate = false;

                CreateComplianceReviewPDF(model, "ClientPreview.pdf");
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(DocumentController)).Error(ex);
                throw;
            }      
        }

        /// <summary>
        /// Create PDF version of report, only including Action plan
        /// </summary>
        /// <param name="checklist">json value of the checklist model</param>
        [HttpPost, ValidateInput(false)]
        public void CreateActionPlanPDF(string checklist)
        {
            try
            {
                var model = Newtonsoft.Json.JsonConvert.DeserializeObject<ChecklistViewModel>(checklist);

                model.IncludeActionPlan = true;

                model.IncludeComplianceReview = false;
                model.IncludeIRNs = false;
                model.AllQuestionTemplate = false;

                CreateComplianceReviewPDF(model, "ActionPlan.pdf");
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(DocumentController)).Error(ex);
                throw;
            }
        }

         public void CreateAllQuestionsPDF(string checklist)
        {
            try
            {
                var model = Newtonsoft.Json.JsonConvert.DeserializeObject<ChecklistViewModel>(checklist);

                model.AllQuestionTemplate = true;

                model.IncludeActionPlan = false;
                model.IncludeIRNs = false;
                model.IncludeComplianceReview = true; // SGG: should this be true or not? 

                
                CreateComplianceReviewPDF(model, "AllQuestionTemplate.pdf");
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(DocumentController)).Error(ex);
                throw;
            }         
        }

        private void CreateComplianceReviewPDF(ChecklistViewModel model, string filename)
        {
            var checklistPdfCreator = ObjectFactory.GetInstance<IChecklistPdfCreator>();
            checklistPdfCreator.ChecklistViewModel = model;

            model.ContentPath = string.Format("{0}://{1}{2}", Request.Url.Scheme, Request.Url.Authority, "/content");
          
            var pdfBytes = checklistPdfCreator.GetBytes();

            // get the object representing the HTTP response to browser
            HttpResponse httpResponse = System.Web.HttpContext.Current.Response;

            // add the Content-Type and Content-Disposition HTTP headers
            httpResponse.AddHeader("Content-Type", "application/pdf");

            httpResponse.AddHeader("Content-Disposition", String.Format("attachment; filename={0}; size={1}", 
                                                filename, pdfBytes.Length.ToString())
                                                );

            // write the PDF document bytes as attachment to HTTP response 
            httpResponse.BinaryWrite(pdfBytes);

            // Note: it is important to end the response, otherwise the ASP.NET
            // web page will render its content to PDF document stream
            httpResponse.End();
        }
    }
}
