using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using BusinessSafe.Application.RestAPI.Responses;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.RepositoryContracts;
using EvaluationChecklist.ClientDetails;
using EvaluationChecklist.Models;
using log4net;
using NHibernate.Linq;


namespace EvaluationChecklist.Helpers
{
    public class ComplianceReviewReportViewModelFactory : IComplianceReviewReportViewModelFactory
    {
        private ComplianceReviewReportViewModel _model;
        private IClientDetailsService _clientDetailsService;

        private IEmployeeRepository _employeeRepository;

        enum ResponseType {Unacceptable = 0, ImprovementRequired = 1, NotKnown = 2 }

        public ComplianceReviewReportViewModelFactory(IClientDetailsService clientDetailsService, IEmployeeRepository employeeRepository)
        {
            _clientDetailsService = clientDetailsService;
            _employeeRepository = employeeRepository;
        }

        public ComplianceReviewReportViewModel GetViewModel(ChecklistViewModel checklistViewModel)
        {   
            _model = new ComplianceReviewReportViewModel();

            if (!checklistViewModel.AllQuestionTemplate)
            {
                AddSiteVisitDetails(checklistViewModel);

                AddSiteDetails(checklistViewModel);

                AddImmediateRiskNotifications(checklistViewModel);

                ParseAnswers(checklistViewModel);

                AddCountOfDifferentResponses(checklistViewModel);
               
            }
            else
            {
                ParseAllQuestions(checklistViewModel);
            }

            AddSectionSelections(checklistViewModel);
            return _model;
        }

        private void ParseAllQuestions(ChecklistViewModel checklistViewModel)
        {
            // For all questions template, put all questions in Compliance review items
            var questions = checklistViewModel.Questions.Where( x =>  !x.Question.Deleted );

            questions
               .OrderBy(x => x.CategoryNumber)
               .ThenBy(x => x.QuestionNumber)
               .ToList()
               .ForEach(questionAnswer =>
               {
                   var reviewItem = new ComplianceReviewItem();
                   reviewItem.QuestionText = questionAnswer.Question.Text;
                   reviewItem.CategoryName = questionAnswer.Question.Category == null ? String.Empty : questionAnswer.Question.Category.Title;
                   reviewItem.CategoryNumber = questionAnswer.CategoryNumber;
                   reviewItem.QuestionNumber = questionAnswer.QuestionNumber;

                   if (questionAnswer.Answer != null && GetSelectedResponse(questionAnswer) != null)
                   {
                       reviewItem.SupportingDocumentationStatus = questionAnswer.Answer.SupportingDocumentationStatus;
                       reviewItem.SupportingDocumentationDate = questionAnswer.Answer.SupportingDocumentationDate != null ? questionAnswer.Answer.SupportingDocumentationDate.Value.ToLocalTime().ToString("dd/MM/yyyy") : null;
                       reviewItem.SupportingEvidence = questionAnswer.Answer.SupportingEvidence;
                       reviewItem.ActionRequired = questionAnswer.Answer.ActionRequired;
                       reviewItem.Status = ComplianceReviewItemStatus(questionAnswer);
                   }

                   _model.ComplianceReviewItems.Add(reviewItem);
               });
        }

        private void AddCountOfDifferentResponses(ChecklistViewModel checklistViewModel)
        {
            _model.CountOfSatisfactory = GetQuestionsByResponseTitle(checklistViewModel, "Acceptable").Count();
            _model.CountOfFurtherActionRequiredItems = GetQuestionsByResponseTitle(checklistViewModel, "Improvement Required").Count();
            _model.CountOfImmediateActionRequiredItems = GetQuestionsByResponseTitle(checklistViewModel, "Unacceptable").Count();
        }

        private void AddSectionSelections(ChecklistViewModel checklistViewModel)
        {
            _model.IncludeActionPlan = checklistViewModel.IncludeActionPlan;
            _model.IncludeComplianceReview = checklistViewModel.IncludeComplianceReview;
            _model.IncludeIRNs = checklistViewModel.IncludeIRNs;
            _model.IncludeGuidanceNotes = checklistViewModel.IncludeGuidanceNotes;
            _model.AllQuestionsTemplate = checklistViewModel.AllQuestionTemplate;
        }
       
        private void AddSiteDetails(ChecklistViewModel checklistViewModel)
        {
            if (_model.Site == null)
            {
                _model.Site = new SiteViewModel();
            }

            if (checklistViewModel.SiteId != null && checklistViewModel.ClientId != null)
            {              
                _model.Site.Id = (int) checklistViewModel.SiteId;

                SiteAddressResponse response = _clientDetailsService.GetSite(checklistViewModel.ClientId.Value, checklistViewModel.SiteId.Value);
                
                if ( response != null)
                {                    
                    _model.Site.SiteName = response.SiteName;
                    _model.Site.Address1 = response.Address1;
                    _model.Site.Address2 = response.Address2;
                    _model.Site.Address3 = response.Address3;
                    _model.Site.Address4 = response.Address4;
                    _model.Site.Postcode = response.Postcode;

                }
            }        
        }

        private void AddImmediateRiskNotifications(ChecklistViewModel checklistViewModel)
        {            
            foreach( ImmediateRiskNotificationViewModel irn in checklistViewModel.ImmediateRiskNotifications)
            {
                ImmediateRiskNotificationPlanItem item = new ImmediateRiskNotificationPlanItem()
                                                             {                           
                                                                 Reference = irn.Reference,
                                                                 SignificantHazardIdentified = irn.SignificantHazard,
                                                                 RecommendedImmediateAction = irn.RecommendedImmediate,
                                                                 AllocatedTo = checklistViewModel.SiteVisit.PersonSeen == null ? 
                                                                            String.Empty : checklistViewModel.SiteVisit.PersonSeen.Name
                                                             };

                _model.ImmediateRiskNotifications.Add( item);   
            }            
        }

        private void ParseAnswers(ChecklistViewModel checklistViewModel)
        {            
             if (checklistViewModel.Questions != null)
             {
                 AddComplianceReviewItems(checklistViewModel);
                 AddActionPlanItems(checklistViewModel);
             }
        }
    
        private int GetTimescalePriority(TimescaleViewModel timescale, ResponseType responseType)
        {
            int priority = 0;

            // changed their mind again so have two different sets of priorities, left old ones in to generate existing reports correctly
            if (timescale != null)
            {
                switch (timescale.Name)
                {
                    case "Urgent Action Required":
                        priority = 1;
                        break;
                    case "Six Weeks":
                        if (responseType == ResponseType.Unacceptable)
                            priority = 2;
                        if (responseType == ResponseType.ImprovementRequired)
                            priority = 3;
                        break;
                    case "One Month":
                        priority = 4;
                        break;
                    case "Three Months":
                        priority = 5;
                        break;
                    case "Six Months":
                        priority = 6;
                        break;
                    case "None":
                        priority = 7;
                        break;                    
                }
            }
            else
            {
                priority = 8;             
            }
            return priority;            
        }

        private void AddActionPlanItems(ChecklistViewModel checklistViewModel)
        {
            var unacceptableResponses = GetQuestionsByResponseTitle(checklistViewModel, "Unacceptable").ToList();
            var improvementRequiredResponses = GetQuestionsByResponseTitle(checklistViewModel, "Improvement Required").ToList();
            
            unacceptableResponses.ForEach(x =>
            {
                _model.ActionPlanItems.Add(CreateActionPlanItem(x, ResponseType.Unacceptable));
            });

            improvementRequiredResponses.ForEach(x =>
            {
                _model.ActionPlanItems.Add(CreateActionPlanItem(x, ResponseType.ImprovementRequired));
            });

           // AddQuestionsToActionPlan(checklistViewModel, "Unacceptable");
          //  AddQuestionsToActionPlan(checklistViewModel, "Improvement Required");
        }

        //private void AddQuestionsToActionPlan(ChecklistViewModel checklistViewModel, string title)
        //{
        //    var questions = checklistViewModel.Questions
        //        .Where(     x => x.Answer != null                            
        //                    && GetSelectedResponse(x) != null 
        //                    && GetSelectedResponse(x).Title == title
        //                    )    
        //        .OrderBy( x => GetTimescalePriority(x.Answer.Timescale, ResponseType.NotKnown))
        //        .ThenBy(x => x.CategoryNumber)
        //        .ThenBy(x => x.QuestionNumber)
        //        .ToList();

        //    questions.ForEach(x =>{

        //        _model.ActionPlanItems.Add(CreateActionPlanItem(x, ResponseType.NotKnown));
        //                          });
            
        //}

        private IEnumerable<QuestionAnswerViewModel> GetQuestionsByResponseTitle(ChecklistViewModel checklistViewModel, string responseTitle)
        {
            var questions = checklistViewModel.Questions
                .Where(x => x.Answer != null
                            && GetSelectedResponse(x) != null
                            && GetSelectedResponse(x).Title == responseTitle
                            && !x.Question.Deleted
                );

            return questions;
        }

        //private bool IsQuestionAnswered( QuestionAnswerViewModel model)
        //{
        //    return !(model.Answer == null || GetSelectedResponse(model) == null);
        //}

        private void AddComplianceReviewItems(ChecklistViewModel checklistViewModel)
        {
            GetQuestionsByResponseTitle(checklistViewModel,"Acceptable")
                .OrderBy(x => x.CategoryNumber)
                .ThenBy(x => x.QuestionNumber)
                .ToList()
                .ForEach(questionAnswer =>
                {
                    var reviewItem = new ComplianceReviewItem();
                    reviewItem.QuestionText = questionAnswer.Question.Text;
                    reviewItem.CategoryName = questionAnswer.Question.Category == null ? String.Empty: questionAnswer.Question.Category.Title;
                    reviewItem.CategoryNumber = questionAnswer.CategoryNumber;
                    reviewItem.QuestionNumber = questionAnswer.QuestionNumber;

                    if (questionAnswer.Answer != null && GetSelectedResponse(questionAnswer) != null)
                    {
                        reviewItem.SupportingDocumentationStatus = questionAnswer.Answer.SupportingDocumentationStatus;
                        reviewItem.SupportingDocumentationDate = questionAnswer.Answer.SupportingDocumentationDate !=null? questionAnswer.Answer.SupportingDocumentationDate.Value.ToLocalTime().ToString("dd/MM/yyyy"): null;
                        reviewItem.SupportingEvidence = questionAnswer.Answer.SupportingEvidence;
                        reviewItem.ActionRequired = questionAnswer.Answer.ActionRequired;
                        reviewItem.Status = ComplianceReviewItemStatus(questionAnswer);
                    }

                    _model.ComplianceReviewItems.Add(reviewItem);
                });
        }

        private static QuestionResponseViewModel GetSelectedResponse(QuestionAnswerViewModel question)
        {
            QuestionResponseViewModel response = null;

            if (question.Answer != null && question.Answer.SelectedResponseId != null)
            {
                response = question.Question.PossibleResponses.FirstOrDefault(x => x.Id == question.Answer.SelectedResponseId);
            }

            return response;
        }

        private ComplianceReviewItemStatus? ComplianceReviewItemStatus(QuestionAnswerViewModel questionAnswer)
        {
            var response = GetSelectedResponse(questionAnswer);

            return ComplianceReviewItemStatus(response);
        }

        private ComplianceReviewItemStatus? ComplianceReviewItemStatus(QuestionResponseViewModel response)
        {
            if (response == null)
            {
                return null;
            }
            switch (response.Title)
            {
                default:
                case "Acceptable":
                case "Not Applicable":
                    return Models.ComplianceReviewItemStatus.Satisfactory;
                    break;

                case "Unacceptable":
                    return Models.ComplianceReviewItemStatus.ImmediateActionRequired;                   
                    break;

                case "Improvement Required":
                    return Models.ComplianceReviewItemStatus.FurtherActionRequired;                  
                    break;
            }
        }

        private string GetAssignedToEmployeeName( QuestionAnswerViewModel qaViewModel )
        {
            string employeeName = String.Empty;

            if (qaViewModel.Answer.AssignedTo != null && qaViewModel.Answer.AssignedTo.Id.HasValue)
            {
                Employee assignedToEmployee =
                    _employeeRepository.GetById( qaViewModel.Answer.AssignedTo.Id.GetValueOrDefault() );                            

                if (assignedToEmployee == null)
                {
                    employeeName = qaViewModel.Answer.AssignedTo.NonEmployeeName;
                }
                else
                {
                    employeeName = assignedToEmployee.FullName;
                }
            }

            
            TextInfo myTI = new CultureInfo("en-US",false).TextInfo;
            return myTI.ToTitleCase(employeeName.ToLower());
            
        }

        private ActionPlanItem CreateActionPlanItem(QuestionAnswerViewModel question, ResponseType responseType)
        {
            var selectedResponse = GetSelectedResponse(question);
            
            ActionPlanItem actionPlanItem = new ActionPlanItem()
                                                {
                                                    AreaOfNonCompliance = GetAreaOfNonCompliance(question, selectedResponse), 
                                                    ActionRequired = question.Answer.ActionRequired,
                                                    GuidanceNumber = question.Answer.GuidanceNotes,
                                                    TargetTimescale = question.Answer.Timescale == null ? String.Empty : question.Answer.Timescale.Name,
                                                    AllocatedTo =  GetAssignedToEmployeeName(question),   
                                                    QuestionNumber = question.QuestionNumber,
                                                    CategoryNumber = question.CategoryNumber,
                                                    SupportingEvidence = question.Answer.SupportingEvidence,
                                                    Status = ComplianceReviewItemStatus(question),
                                                    TimescalePriroity = GetTimescalePriority(question.Answer.Timescale, responseType)
                                                };
            return actionPlanItem;
        }

        private static string GetAreaOfNonCompliance(QuestionAnswerViewModel question, QuestionResponseViewModel selectedResponse)
        {
            if (string.IsNullOrEmpty(question.Answer.AreaOfNonCompliance)){
              return  !string.IsNullOrEmpty(selectedResponse.ReportLetterStatement) ? selectedResponse.ReportLetterStatement : question.Question.Text;
            }

            return question.Answer.AreaOfNonCompliance;
        }

        private void AddSiteVisitDetails(ChecklistViewModel checklistViewModel)
        {
            if (checklistViewModel.SiteVisit != null)
            {
                if (checklistViewModel.SiteVisit.PersonSeen != null)
                {
                    _model.PersonSeen = checklistViewModel.SiteVisit.PersonSeen.Name;
                }

                checklistViewModel.PersonsSeen.ForEach(personSeen =>
                {
                    if (!string.IsNullOrEmpty(_model.PersonsSeen))
                    {
                        _model.PersonsSeen += ", ";
                    }

                    _model.PersonsSeen += personSeen.FullName; 
                    
                });

                _model.VisitDate = checklistViewModel.SiteVisit.VisitDate.ToLocalTime();
                _model.AreasVisited = checklistViewModel.SiteVisit.AreasVisited;
                _model.AreasNotVisited = checklistViewModel.SiteVisit.AreasNotVisited;
            }
        }
    }
}