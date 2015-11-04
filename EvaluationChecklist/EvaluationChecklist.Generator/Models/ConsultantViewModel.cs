using System;

namespace EvaluationChecklist.Models
{
    public class ConsultantViewModel
    {
        public Guid Id { get; set; }
        public string Forename { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string Fullname { get; set; }
        public bool Blacklisted { get; set; }
        public Guid? QaAdvisorAssigned { get; set; }
        public string Username { get; set; }
    }
}