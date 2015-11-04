using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using log4net;

namespace EvaluationChecklist.Controllers
{
    [Authorize]
    public class IndustryController : ApiController
    {
        private readonly IChecklistTemplateRepository _industryRepository;
        private readonly IChecklistTemplateQuestionRepository _industryQuestionRepository;
        private readonly IQuestionRepository _questionRepository;
        private readonly BusinessSafe.Domain.RepositoryContracts.IUserForAuditingRepository _userForAuditingRepository;
        
        public IndustryController(IDependencyFactory dependencyFactory)
        {
            _industryRepository = dependencyFactory.GetInstance<IChecklistTemplateRepository>();
            _industryQuestionRepository = dependencyFactory.GetInstance<IChecklistTemplateQuestionRepository>();
            _questionRepository = dependencyFactory.GetInstance<IQuestionRepository>();
            _userForAuditingRepository = dependencyFactory.GetInstance<BusinessSafe.Domain.RepositoryContracts.IUserForAuditingRepository>();
        }

        /// <summary>
        /// Returns a list of industries and their associated questions.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public List<IndustryViewModel> Get()
        {
            try
            {
                var industries = _industryRepository.GetAll()
                    .Where(x=> x.TemplateType == ChecklistTemplateType.Industry && x.Deleted == false)
                    .Select(x => new IndustryViewModel()
                                     {
                                         Id = x.Id,
                                         Title = x.Name,
                                         Draft = x.Draft,
                                         Questions = x.Questions.Select(q => q.Question.Id).ToList(),
                                         Deleted = x.Deleted
                                     }).ToList();

                return industries;
            }

            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(IndustryController)).Error(ex);
                throw;
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="model"></param>
        [HttpPost]
        public void UpdateIndustryQuestions(IndustryQuestionModel model)
        {
            try
            {
                List<ChecklistTemplateQuestion> industryQuestions = _industryQuestionRepository.GetByQuestion(model.QuestionId);

                var user = _userForAuditingRepository.GetSystemUser();
                foreach (var iq in industryQuestions)
                {
                    iq.MarkForDelete(user);
                    _industryQuestionRepository.SaveOrUpdate(iq);
                }

                foreach (var industryId in model.IndustryIds)
                {
                    var indQuest = new ChecklistTemplateQuestion();
                    indQuest.Id = Guid.NewGuid();
                    indQuest.CreatedBy = user;
                    indQuest.CreatedOn = DateTime.Now;
                    indQuest.LastModifiedBy = user;
                    indQuest.LastModifiedOn = DateTime.Now;
                    indQuest.Deleted = false;

                    indQuest.ChecklistTemplate = _industryRepository.GetById(industryId);
                    indQuest.Question = _questionRepository.GetById(model.QuestionId);

                    _industryQuestionRepository.SaveOrUpdate(indQuest);
                }                            
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(IndustryController)).Error(ex);
                throw;
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="model"></param>
        [HttpPost]
        public void UpdateIndustry(IndustryViewModel model)
        {
            try
            {
                var user = _userForAuditingRepository.GetSystemUser();
                
                ChecklistTemplate template = _industryRepository.GetById(model.Id);
                template.Name = model.Title;
                template.Draft = model.Draft;
                template.CreatedBy = user;
                template.CreatedOn = DateTime.Now;
                template.LastModifiedBy = user;
                template.LastModifiedOn = DateTime.Now;     

                //template.Deleted
                //template.questions
                
                _industryRepository.SaveOrUpdate(template);                
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(IndustryController)).Error(ex);
                throw;
            }
        }

        [HttpGet]
        public List<IndustryViewModel> GetIndustriesByQuestionId(Guid questionId)
        {
            try 
            {
               var industries = _industryQuestionRepository
                    .GetByQuestion(questionId)   
                    .Where( y => y.Deleted == false)
                    .Select( x => new IndustryViewModel()
                                     {
                                         Id = x.ChecklistTemplate.Id,
                                         Title = x.ChecklistTemplate.Name,
                                         Questions = null
                                     })
                    
                    .ToList();

                return industries;
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(IndustryController)).Error(ex);
                throw;
            }            
        }

        /// <summary>
        /// We need this for CORS. if this is removed clients will receive a 405 method not allowed http error.
        /// </summary>
        /// <returns></returns>
        [HttpOptions]
        public HttpResponseMessage Options()
        {
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
