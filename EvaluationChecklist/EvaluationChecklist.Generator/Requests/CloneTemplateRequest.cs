using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EvaluationChecklist.Requests
{
    public class CloneTemplateRequest
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int TemplateType { get; set; }
    }
}