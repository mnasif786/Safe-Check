using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EvaluationChecklist.Requests
{
    public class UpdateTemplateQuestionRequest
    {
        public Guid TemplateId { get; set; }
        public Guid QuestionId { get; set; }
        public bool Exclude { get; set; }
    }
}