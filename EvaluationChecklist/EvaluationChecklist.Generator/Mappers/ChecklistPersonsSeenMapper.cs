using System;
using System.Collections.Generic;
using System.Linq;
using BusinessSafe.Domain.Entities.SafeCheck;
using EvaluationChecklist.Models;

namespace EvaluationChecklist.Mappers
{
    public static class ChecklistPersonsSeenMapper
    {
        public static PersonsSeenViewModel Map(this ChecklistPersonSeen personSeen)
        {
            var personSeenViewModel = new PersonsSeenViewModel()
                                        {
                                            Id = personSeen.Id,
                                            EmployeeId = personSeen.Employee == null ? Guid.Empty : personSeen.Employee.Id,
                                            FullName = personSeen.FullName,
                                            EmailAddress = personSeen.EmailAddress
                                        };



            return personSeenViewModel;
        }

        public static List<PersonsSeenViewModel> Map(this IEnumerable<ChecklistPersonSeen> personsSeen)
        {
            return personsSeen
                .Select(Map)
                .ToList();
        }
    }

   
}