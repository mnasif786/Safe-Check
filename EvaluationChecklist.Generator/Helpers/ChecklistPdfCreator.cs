using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using BusinessSafe.Domain.Entities.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Models;
using StructureMap;

namespace EvaluationChecklist.Helpers
{
    public class ChecklistPdfCreator : IChecklistPdfCreator
    {
        private readonly IPDFGenerator _pdfGenerator;
        private ChecklistViewModel _checklistViewModel;
        private readonly IComplianceReviewReportViewModelFactory _complianceReviewReportViewModelFactory;

        public ChecklistPdfCreator()
        {
            _pdfGenerator = ObjectFactory.GetInstance<IPDFGenerator>();

            _complianceReviewReportViewModelFactory =
                ObjectFactory.GetInstance<ComplianceReviewReportViewModelFactory>();
        }

        public ChecklistViewModel ChecklistViewModel
        {
            get { return _checklistViewModel; }
            set { _checklistViewModel = value; }
        }

        public DateTime LetterDate
        {
            get
            {
                var date = DateTime.Now;
                if (_checklistViewModel.Status == Checklist.STATUS_SUBMITTED && _checklistViewModel.SubmittedOn.HasValue)
                {
                    date = _checklistViewModel.SubmittedOn.Value;
                }
                return date;
            }
        }
  

        public byte[] GetBytes()
        {
            // HEADER TEXT
            var headerText = String.Empty;
            if (_checklistViewModel != null && _checklistViewModel.Site != null)
            {
                headerText = String.Format("{0} - {1}", _checklistViewModel.Site.SiteName, _checklistViewModel.Site.Postcode);
            }

            // LETTER DATE
            SetLetterDate();

            // COVERING LETTER
            var reportHeaderType = string.IsNullOrEmpty(_checklistViewModel.ReportHeaderType)
                                          ? SummaryReportHeaderType.None
                                          : (SummaryReportHeaderType)
                                            Enum.Parse(typeof(SummaryReportHeaderType), _checklistViewModel.ReportHeaderType);

            _checklistViewModel.CoveringLetterContent = ExecutiveSummaryLetterHeadFixer.UpdateLetterHeaderHtml(_checklistViewModel.CoveringLetterContent, reportHeaderType);
            AddStylesheetToCoveringLetterContent(_checklistViewModel);

            if (_checklistViewModel.SpecialReport)
            {
                return _pdfGenerator.CreateSpecialReport(_checklistViewModel.CoveringLetterContent, headerText, _checklistViewModel.ContentPath, reportHeaderType);
            }

            // REPORT
            var complianceReviewReportViewModelString = RenderViewToString(_complianceReviewReportViewModelFactory.GetViewModel(_checklistViewModel));
                       
            bool includeExecutiveSummary = false;
            if ( _checklistViewModel.AllQuestionTemplate)
            {
                includeExecutiveSummary = false;
            }
            else
            {
                if(_checklistViewModel.IncludeActionPlan )
                {
                    if (   _checklistViewModel.IncludeCoveringLetterContent
                        && _checklistViewModel.IncludeComplianceReview
                        && _checklistViewModel.IncludeIRNs)
                    {
                        includeExecutiveSummary = true;
                    }
                    else
                    {
                        includeExecutiveSummary = false;
                    }

                }
            }
          
            return _pdfGenerator.CreateReport(   complianceReviewReportViewModelString,
                                                            _checklistViewModel.CoveringLetterContent,
                                                            headerText,
                                                            _checklistViewModel.ContentPath,
                                                            _checklistViewModel.ClientLogoFilename,
                                                            includeExecutiveSummary,
                                                            reportHeaderType);                                                                             
        }

        private void SetLetterDate()
        {
            if (_checklistViewModel.CoveringLetterContent != null)
            {
                _checklistViewModel.CoveringLetterContent = Regex.Replace(_checklistViewModel.CoveringLetterContent,
                                                                          "<p data-letter-date.*?>(.*?)<\\/p>",
                                                                          "<p>" + LetterDate.ToLongDateString() + "</p>");
            }
        }

        private static void AddStylesheetToCoveringLetterContent(ChecklistViewModel model)
        {
            var docType = @"<!DOCTYPE html>";
            var stylesheet = @"<style type=""text/css""> body, html, p {font-family:Arial, Helvetica, sans-serif; font-size:18pt; font-weight: normal;text-align:justify; page-break-inside: avoid; }  li {page-break-inside: avoid;} </style>";
            model.CoveringLetterContent = string.Format(@"{2}<html><head>{0}</head><body>{1}</body></html>", stylesheet, model.CoveringLetterContent, docType);

        }

        //http://wouterdekort.blogspot.co.uk/2012/10/rendering-aspnet-mvc-view-to-string-in.html        
        public static string RenderViewToString(ComplianceReviewReportViewModel viewData)
        {
            var controllerName = "Document";
            var viewName = "ActionPlan";
            var context = HttpContext.Current;   
            var contextBase = new HttpContextWrapper(context);  
            var routeData = new RouteData();   
            routeData.Values.Add("controller", controllerName);  
            var controllerContext = new ControllerContext(contextBase, routeData, new DocumentController());  
            var razorViewEngine = new RazorViewEngine();  
            var razorViewResult = razorViewEngine.FindView(controllerContext, viewName, "", false); 
            var writer = new StringWriter();
            var viewContext = new ViewContext(controllerContext, razorViewResult.View, new ViewDataDictionary(viewData), new TempDataDictionary(), writer); 
            razorViewResult.View.Render(viewContext, writer);
            return writer.ToString(); 
        }
    }
}