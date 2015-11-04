using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Mappers;
using EvaluationChecklist.Models;
using EvaluationChecklist.Requests;
using NHibernate.Linq;
using StructureMap;
using log4net;

namespace EvaluationChecklist.Controllers
{

    [Authorize]
    public class ChecklistTemplateController : ApiController
    {
        private readonly IChecklistTemplateRepository _templateRepository;
        private readonly IUserForAuditingRepository _userForAuditingRepository;
        private readonly BusinessSafe.Domain.RepositoryContracts.SafeCheck.IQuestionRepository _questionRepository;
        
        public ChecklistTemplateController(IDependencyFactory dependencyFactory)
        {
            _templateRepository = dependencyFactory.GetInstance<IChecklistTemplateRepository>();
            _userForAuditingRepository = dependencyFactory.GetInstance<IUserForAuditingRepository>();
            _questionRepository = dependencyFactory.GetInstance<BusinessSafe.Domain.RepositoryContracts.SafeCheck.IQuestionRepository>();
        }

        /// <summary>
        /// Returns a list of checklist templates with asssociated questions
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public List<ChecklistTemplateViewModel> Get()
        {
            try
            {
                var templates = _templateRepository.GetAll().Where(x => x.Deleted == false).Map().ToList();

                return templates;
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(ChecklistTemplateController)).Error(ex);
                throw;
            }
        }

        /// <summary>
        /// Returns a list of checklist templates with asssociated question Ids only
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public List<ChecklistTemplateQuestionIdsViewModel> GetWithQuestionIds()
        {
            try
            {
                var templates =
                    _templateRepository.GetAll()
                        .Where(x => x.Deleted == false)
                        .MapToChecklistTemplateQuestionIdsViewModel().ToList();
               
                return templates;
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(ChecklistTemplateController)).Error(ex);
                throw;
            }
        }

        /// <summary>
        /// Return a checklist template with questions
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public ChecklistTemplateViewModel GetById(Guid id)
        {
            try
            {
                var template = _templateRepository.GetById(id);

                if (template == null)
                {
                    throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound));
                }

                return template.Map();

            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(ChecklistTemplateController)).Error(ex);
                throw;
            }
        }

        [HttpPost]
        public HttpResponseMessage Clone(CloneTemplateRequest templateRequest)
        {
            try
            {
                var nameAlreadyExists = _templateRepository.DoesChecklistTemplateExistWithTheSameName(templateRequest.Name,
                                                                                      templateRequest.Id);
                if (nameAlreadyExists)
                {
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
                }

                var existingTemplate = _templateRepository.GetById(templateRequest.Id);
                if (existingTemplate != null)
                {
                    var user = _userForAuditingRepository.GetSystemUser();
                    var template = ChecklistTemplate.Create(templateRequest.Name, (ChecklistTemplateType)templateRequest.TemplateType, user);

                    foreach (var question in existingTemplate.Questions)
                    {
                        var templateQuestion = ChecklistTemplateQuestion.Create(template, question.Question, user);
                        template.AddQuestion(templateQuestion, user);
                    }
                    _templateRepository.SaveOrUpdate(template);

                    return Request.CreateResponse(HttpStatusCode.OK);
                }


                return Request.CreateResponse(HttpStatusCode.NotFound);

            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(ChecklistTemplateController)).Error(ex);
                throw;
            }
        }

        [HttpPost]
        public HttpResponseMessage Rename(RenameTemplateRequest request)
        {
            try
            {
                var nameAlreadyExists = _templateRepository.DoesChecklistTemplateExistWithTheSameName(request.Name,
                                                                                                      request.Id);
                if (nameAlreadyExists)
                {
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
                }
                var existingTemplate = _templateRepository.GetById(request.Id);
                if (existingTemplate != null)
                {
                    existingTemplate.Name = request.Name;
                    _templateRepository.SaveOrUpdate(existingTemplate);
                    return Request.CreateResponse(HttpStatusCode.OK);
                }
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(ChecklistTemplateController)).Error(ex);
                throw;
            }
        }

        [HttpPost]
        public HttpResponseMessage UpdateTemplateQuestion(UpdateTemplateQuestionRequest request)
        {
            try
            {
                var user = _userForAuditingRepository.GetSystemUser();
                var template = _templateRepository.GetById(request.TemplateId);
                var question = _questionRepository.GetById(request.QuestionId);

                if (template == null || question == null)
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                }

                if (request.Exclude)
                {
                    template.RemoveQuestion(question, user);
                }
                else
                {
                    template.AddQuestion(question, user);

                }

                _templateRepository.SaveOrUpdate(template);

                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistTemplateController)).Error(ex);
                throw;
            }
        }

        /// <summary>
        /// Deletes a template
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage DeleteTemplate(Guid id)
        {
            try
            {
                var template = _templateRepository.GetById(id);

                if (template != null)
                {
                    template.Deleted = true;
                    _templateRepository.SaveOrUpdate(template);

                    return Request.CreateResponse(HttpStatusCode.OK);
                }
                
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(ChecklistTemplateController)).Error(ex);
                throw;
            }
        }


        /// <summary>
        /// returns the template name
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public string GetTemplateName(Guid id)
        {
            try
            {
                var template = _templateRepository.GetById(id);

                if (template == null)
                {
                    throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound));
                }
                

                return template.Name;
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(ChecklistTemplateController)).Error(ex);
                throw;
            }
        }
    }
}
