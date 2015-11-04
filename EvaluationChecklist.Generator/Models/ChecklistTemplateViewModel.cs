using System;
using System.Collections.Generic;

namespace EvaluationChecklist.Models
{
    public class ChecklistTemplateViewModel
    {
        public Guid Id { get; set; }

        public string Title { get; set; }
        public Boolean Draft { get; set; }
        public List<QuestionViewModel> Questions { get; set; }
        public string TemplateType { get; set; }
        public Boolean Deleted { get; set; }
        public Boolean SpecialTemplate { get; set; }
    }
}