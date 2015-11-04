using System;
using System.Linq;
using System.Collections.Generic;
using BusinessSafe.Domain.Entities.SafeCheck;
using EvaluationChecklist.Models;


namespace EvaluationChecklist.Mappers
{
    public static class ConsultantMapper
    {
        public static ConsultantViewModel Map(this Consultant consultant)
        {
            return new ConsultantViewModel()
            {
                Id = consultant.Id,
                Forename = consultant.Forename,
                Surname = consultant.Surname,
                Fullname = consultant.Forename + ' ' + (!String.IsNullOrEmpty(consultant.Surname) ? consultant.Surname : ""),
                Email = consultant.Email,
                Blacklisted = consultant.PercentageOfChecklistsToSendToQualityControl == 100,
                QaAdvisorAssigned = consultant.QaAdvisorAssigned
            };
        }

        public static IEnumerable<ConsultantViewModel> Map(this IEnumerable<Consultant> consultants)
        {
            return consultants.Select(x => x.Map());
        }
    }
}