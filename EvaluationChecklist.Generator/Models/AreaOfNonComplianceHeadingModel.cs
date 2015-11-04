using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EvaluationChecklist.Models
{
    public class AreaOfNonComplianceHeadingModel
    {
        public Guid Id;
        public string Name { get; set; }
        public int Sequence { get; set; }
    }
}