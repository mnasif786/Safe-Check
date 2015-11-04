using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EvaluationChecklist.Requests
{
    public class RenameTemplateRequest
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
}