using System;
using System.Linq;
using BusinessSafe.Domain.Entities.SafeCheck;
using EvaluationChecklist.Models;

namespace EvaluationChecklist.Mappers
{
    public static class QaAdvisorMapper
    {
        const string HSReportsAdvisorId = "3A204FB3-1956-4EFC-BE34-89F7897570DB";
        public static QaAdvisorViewModel Map(this QaAdvisor qaAdvisor)
        {
            if (qaAdvisor == null)
            {
                return null;
            }
            var hsReportsAdvisorId = Guid.Parse(HSReportsAdvisorId);
            return new QaAdvisorViewModel()
            {
                Id = qaAdvisor.Id,
                Forename = qaAdvisor.Forename,
                Surname = qaAdvisor.Surname,
                Fullname = qaAdvisor.Forename + ' ' + (!String.IsNullOrEmpty(qaAdvisor.Surname) ? qaAdvisor.Surname : ""),
                Initials = qaAdvisor.Forename + ' ' + (qaAdvisor.Id == hsReportsAdvisorId ? qaAdvisor.Surname : (!String.IsNullOrEmpty(qaAdvisor.Surname) ? qaAdvisor.Surname.Substring(0, 1) : "")),
                Email = qaAdvisor.Email,
                InRotation = qaAdvisor.InRotation

            };
        }
    }
}