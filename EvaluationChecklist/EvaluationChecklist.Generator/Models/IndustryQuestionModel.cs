using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EvaluationChecklist.Models
{
    public class IndustryQuestionModel
    {
        public List<Guid> IndustryIds { get; set; }       
        public Guid QuestionId { get; set; }

        public IndustryQuestionModel()
        {
                IndustryIds = new List<Guid>();
        }
    }
}