using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EvaluationChecklist.Models
{
    public class CopyChecklistResponseViewModel
    {
        public Guid ChecklistId { get; set; }
        public int SiteId { get; set; }
    }
}