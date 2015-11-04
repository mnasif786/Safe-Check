using System;
using System.Collections.Generic;

namespace EvaluationChecklist.Models
{
    public class IndustryViewModel
    {
        public Guid Id { get; set; }

        public string Title { get; set; }
        public Boolean Draft { get; set; }
        public List<Guid> Questions { get; set; }
        public Boolean Deleted { get; set; }
    }
}