using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BusinessSafe.Domain.Entities.SafeCheck;
using EvaluationChecklist.Models;
using BusinessSafe.Application.Helpers;

namespace EvaluationChecklist.Mappers
{
    public static class ChecklistTemplateMapper
    {

        public static ChecklistTemplateViewModel Map(this ChecklistTemplate template)
        {
            return new ChecklistTemplateViewModel()
                                     {
                                         Id = template.Id,
                                         Title = template.Name,
                                         Draft = template.Draft,
                                         TemplateType = EnumHelper.GetEnumDescription(template.TemplateType),
                                         Questions = template.Questions.Select(q => q.Question).Map(),
                                         Deleted = template.Deleted,
                                         SpecialTemplate = template.SpecialTemplate
                                     };
        }


        public static List<ChecklistTemplateViewModel> Map(this IEnumerable<ChecklistTemplate> template)
        {
            return template.Select(x => x.Map()).ToList();
        }


        public static List<ChecklistTemplateQuestionIdsViewModel> MapToChecklistTemplateQuestionIdsViewModel(this IEnumerable<ChecklistTemplate> template)
        {
            return template.Select(x => x.MapToChecklistTemplateQuestionIdsViewModel()).ToList();
        }

        public static ChecklistTemplateQuestionIdsViewModel MapToChecklistTemplateQuestionIdsViewModel(this ChecklistTemplate template)
        {
            return new ChecklistTemplateQuestionIdsViewModel()
            {
                Id = template.Id,
                Title = template.Name,
                Draft = template.Draft,
                TemplateType = EnumHelper.GetEnumDescription(template.TemplateType),
                Questions = template.Questions.Select(q => q.Question.Id).ToList(),
                Deleted = template.Deleted,
                SpecialTemplate =template.SpecialTemplate
            };
        }

    }

}