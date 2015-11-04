using System;
using System.Collections.Generic;

namespace EvaluationChecklist.Models
{
    public class ComplianceReviewReportViewModel
    {
        public string PersonSeen { get; set; }
        public string PersonsSeen { get; set; }
        public DateTime? VisitDate { get; set; }
        public string AreasVisited { get; set; }
        public string AreasNotVisited { get; set; }
        public SiteViewModel Site { get; set; }

        public ComplianceReviewReportViewModel()
        {
            ActionPlanItems = new List<ActionPlanItem>();
            ComplianceReviewItems = new List<ComplianceReviewItem>();
            ImmediateRiskNotifications = new List<ImmediateRiskNotificationPlanItem>();

            IncludeActionPlan = true;
            IncludeComplianceReview = true;
            IncludeIRNs = true;
            AllQuestionsTemplate = false;
        }

        public List<ActionPlanItem> ActionPlanItems { get; set; }
        public List<ComplianceReviewItem> ComplianceReviewItems { get; set; }
        public List<ImmediateRiskNotificationPlanItem> ImmediateRiskNotifications { get; set; }

        public bool IncludeActionPlan { get; set; }
        public bool IncludeComplianceReview { get; set; }
        public bool IncludeIRNs { get; set; }

        public bool AllQuestionsTemplate { get; set; }
        public int CountOfImmediateActionRequiredItems { get; set; }
        public int CountOfFurtherActionRequiredItems { get; set; }
        public int CountOfSatisfactory { get; set; }
        public bool? IncludeGuidanceNotes { get; set; }
    }

    public class ActionPlanItem
    {
        public string AreaOfNonCompliance { get; set; }
        public string ActionRequired { get; set; }
        public string GuidanceNumber { get; set; }
        public string TargetTimescale { get; set; }
        public string AllocatedTo { get; set; }
        public int QuestionNumber { get; set; }
        public int CategoryNumber { get; set; }
        public string SupportingEvidence { get; set; }
        public ComplianceReviewItemStatus? Status { get; set; }
        public int TimescalePriroity { get; set; }
    }

    public class ImmediateRiskNotificationPlanItem
    {
        //public string Title { get; set; }
        public string Reference { get; set; }
        public string SignificantHazardIdentified { get; set; }
        public string RecommendedImmediateAction { get; set; }
        public string AllocatedTo { get; set; }       
    }

}