using System;
using System.Collections.Generic;
using System.ComponentModel;

namespace EvaluationChecklist.Models
{
    public class ChecklistViewModel
    {
        public Guid Id { get; set; }
        public int? ClientId { get; set; }
        public int? SiteId { get; set; }
        public SiteViewModel Site { get; set; }
        public string CoveringLetterContent { get; set; }
        public List<CategoryQuestionAnswerViewModel> Categories { get; set; }
        public List<QuestionAnswerViewModel> Questions { get; set; }
        public DateTime? CreatedOn { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? CompletedOn { get; set; }
        public string CompletedBy { get; set; }
        public DateTime? SubmittedOn { get; set; }
        public string SubmittedBy { get; set; }
        public string Status { get; set; }
        public SiteVisitViewModel SiteVisit { get; set; }
        public List<ImmediateRiskNotificationViewModel> ImmediateRiskNotifications { get; set; }
        public bool Submit { get; set; }
        public string PostedBy { get; set; }
        public string ContentPath { get; set; }
        public Guid? IndustryId { get; set; }
        public DateTime? LastModifiedOn { get; set; }
        public bool Deleted { get; set; }
        public DateTime? DeletedOn { get; set; }
        public string DeletedBy { get; set; }
        public string QAComments { get; set; }
        public bool? EmailReportToPerson { get; set; }
        public bool? EmailReportToOthers { get; set; }
        public bool? PostReport { get; set; }
        public string OtherEmailAddresses { get; set; }
		public bool UpdatesRequired { get; set; }

        public bool ExecutiveSummaryUpdateRequired { get; set; }
        public bool ExecutiveSummaryQACommentsResolved { get; set; }
        public string ExecutiveSummaryQASignedOffBy { get; set; }
        public DateTime? ExecutiveSummaryQASignedOffDate { get; set; }
        
        
        public string ReportHeaderType { get; set; }
        public List<PersonsSeenViewModel> PersonsSeen { get; set; }
        public List<OtherEmailsViewModel> OtherEmails { get; set; }
        
        public bool IncludeActionPlan { get; set; }
        public bool IncludeComplianceReview { get; set; }
        public bool AllQuestionTemplate { get; set; }

        public string Jurisdiction { get; set; }
        public bool IncludeCoveringLetterContent { get; set; }
        public bool IncludeIRNs { get; set; }
        public string ClientLogoFilename { get; set; }
        public bool? IncludeGuidanceNotes { get; set; }
        public FavouriteChecklistViewModel Favourite { get; set; }
        public bool RestoreDeletedChecklistOnSave { get; set; }
        public string ClientSiteGeneralNotes { get; set; }
        public bool SpecialReport { get; set; }
        

        public ChecklistViewModel()
        {
            Categories = new List<CategoryQuestionAnswerViewModel>();
            Questions = new List<QuestionAnswerViewModel>();
            ImmediateRiskNotifications = new List<ImmediateRiskNotificationViewModel>();
            SiteVisit = new SiteVisitViewModel();
            PersonsSeen = new List<PersonsSeenViewModel>();
            IncludeCoveringLetterContent = true;
            IncludeIRNs = true;
            OtherEmails = new List<OtherEmailsViewModel>();
            ClientLogoFilename = String.Empty;
            RestoreDeletedChecklistOnSave = false;
            AllQuestionTemplate = false;
        }
    }

    public class CategoryViewModel
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public List<QuestionViewModel> Questions { get; set; }
        public int OrderNumber { get; set; }
        public string TabTitle { get; set; }

        public CategoryViewModel()
        {
            Questions = new List<QuestionViewModel>();
        }
    }

    public class CategoryQuestionAnswerViewModel
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string TabTitle { get; set; }
        public List<QuestionAnswerViewModel> Questions { get; set; }

        public CategoryQuestionAnswerViewModel()
        {
            Questions = new List<QuestionAnswerViewModel>();
        }
    }

    public class SiteViewModel
    {
        public int Id { get; set; }
        public string SiteName { get; set; }
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string Address3 { get; set; }
        public string Address4 { get; set; }
        public string Postcode { get; set; }
    }

    public class ChecklistIndexViewModel
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public DateTime? CreatedOn { get; set; }
        public string CreatedBy { get; set; }
        public string VisitBy { get; set; }
        public string Status { get; set; }
        public DateTime? VisitDate { get; set; }
        public SiteViewModel Site { get; set; }
        public string ClientName { get; set; }
        public string CAN { get; set; }
        public QaAdvisorViewModel QaAdvisor { get; set; }
        public long? ExecutiveSummaryDocumentLibraryId { get; set; }
        public bool HasQaComments { get; set; }
        public bool Deleted { get; set; }
        public bool? HasUnresolvedQaComments { get; set; }
        public DateTime? CompletedOn { get; set; }
        public DateTime? SubmittedOn { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public DateTime? QaAdvisorAssignedOn { get; set; }
        public bool ExecutiveSummaryUpdateRequired { get; set; }
        public bool ExecutiveSummaryQACommentsResolved { get; set; }

        public string QACommentStatus { get; set; }

        public FavouriteChecklistViewModel Favourite { get; set; }

        public string TemplateName { get; set; }

    }

    
}