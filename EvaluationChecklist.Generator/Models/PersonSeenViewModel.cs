using System;

namespace EvaluationChecklist.Models
{
    public class PersonSeenViewModel
    {
        public Guid? Id { get; set; }
        public string Name { get; set; }
        public string EmailAddress { get; set; }
    }

    public class PersonsSeenViewModel
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string EmailAddress { get; set; }
        public Guid? EmployeeId { get; set; }
    }
}
