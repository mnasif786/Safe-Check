using System;
using System.Collections.Generic;
using BusinessSafe.Domain.Entities.SafeCheck;

namespace EvaluationChecklist.Models
{
    public class QuestionViewModel
    {
        public virtual Guid Id { get; set; }
        public virtual string Text { get; set; }
        public List<QuestionResponseViewModel> PossibleResponses { get; set; }
        public virtual Guid CategoryId { get; set; }
        public virtual CategoryViewModel Category { get; set; }
        public bool Mandatory { get; set; }
        public long? SpecificToClientId { get; set; }
        public int OrderNumber { get; set; }
        public bool Deleted { get; set; }
        public bool CustomQuestion { get; set; }
        public string GuidanceNotes { get; set; }

        public QuestionViewModel()
        {
            PossibleResponses = new List<QuestionResponseViewModel>();
        }
    }

    public class QuestionOrderViewModel
    {
        public Guid QuestionId { get; set; }
        public int OrderNumber { get; set; }
    }

    public class AddEditQuestionViewModel
    {
        public Guid Id { get; set; }
        public string Text { get; set; }
        public Guid CategoryId { get; set; }
        public string GuidanceNotes { get; set; }
        public bool Mandatory { get; set; }
        public int OrderNumber { get; set; }
        public bool Deleted { get; set; }
        public bool AcceptableEnabled { get; set; }
        public bool UnacceptableEnabled { get; set; }
        public bool ImprovementRequiredEnabled { get; set; }
        public bool NotApplicableEnabled { get; set; }
        public string SupportingEvidence { get; set; }
        public string ActionRequired { get; set; }
        public string ImprovementRequired { get; set; }
        public IndustryQuestionModel Industries { get; set; }
        public string AreaOfNonCompliance { get; set; }

        public Guid AreaOfNonComplianceHeadingId { get; set; }
        public List<AreaOfNonComplianceHeadingModel> AreaOfNonComplianceHeadings { get; set; }

        public List<IndustryViewModel> IndustryTemplates { get; set; }


        public AddEditQuestionViewModel()
        {
            Industries =  new IndustryQuestionModel();
            AreaOfNonComplianceHeadings = new List<AreaOfNonComplianceHeadingModel>();
            IndustryTemplates = new List<IndustryViewModel>();
        }
       
    }
    
    public class QuestionResponseViewModel
    {
        public Guid Id { get; set; }

        public string Title { get; set; }
        public string SupportingEvidence { get; set; }
        public string ActionRequired { get; set; }
        public string ResponseType { get; set; }
        public string GuidanceNotes { get; set; }
        public string ReportLetterStatement { get; set; }
        public string ReportLetterStatementCategory { get; set; }
        public bool Deleted { get; set; }

        // needed to fix problem with returning duplicated possible responses if checklists saved incorrectly
        public class PossibleResponsesComparer : IEqualityComparer<QuestionResponseViewModel>
        {
            public bool Equals(QuestionResponseViewModel a, QuestionResponseViewModel b)
            {
                if (a.Title == b.Title)
                    return true;
                else
                {
                    return false;
                }
            }

            public int GetHashCode(QuestionResponseViewModel obj)
            {
                //Check whether the object is null 
                if (Object.ReferenceEquals(obj.Title, null)) return 0;

                return obj.Title.GetHashCode();
            }
        }
    }
}