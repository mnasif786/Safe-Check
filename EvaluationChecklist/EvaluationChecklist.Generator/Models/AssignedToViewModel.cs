using System;

namespace EvaluationChecklist.Models
{
    public class AssignedToViewModel
    {
        public Guid? Id { get; set; }
        public string NonEmployeeName { get; set; }
        public string ForeName { get; set; }
        public string Surname { get; set; }
        public string FullName { get; set; }
        public string EmailAddress { get; set; }
    }
}