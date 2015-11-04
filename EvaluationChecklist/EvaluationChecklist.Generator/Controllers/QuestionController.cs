using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using BusinessSafe.Domain.Common;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Mappers;
using EvaluationChecklist.Models;
using StructureMap;
using System.Linq;
using log4net;
using Question = BusinessSafe.Domain.Entities.SafeCheck.Question;

namespace EvaluationChecklist.Controllers
{
    [Authorize]
    public class QuestionController : ApiController
    {
        private readonly IQuestionRepository _questionRepo;
        private readonly ICategoryRepository _categoryRepo;
        private readonly IChecklistTemplateRepository _industryRepository;
        private readonly IRepository<ReportLetterStatementCategory, Guid>  _reportLetterStatementCategoryRepo;

        private readonly BusinessSafe.Domain.RepositoryContracts.IUserForAuditingRepository _userForAuditingRepository;

        public QuestionController(IDependencyFactory dependencyFactory)
        {
            _questionRepo = dependencyFactory.GetInstance<IQuestionRepository>(); ;
            _categoryRepo = dependencyFactory.GetInstance<ICategoryRepository>();
            _industryRepository = dependencyFactory.GetInstance<IChecklistTemplateRepository>();
            _userForAuditingRepository = dependencyFactory.GetInstance<BusinessSafe.Domain.RepositoryContracts.IUserForAuditingRepository>();
            _reportLetterStatementCategoryRepo = dependencyFactory.GetInstance<IRepository<ReportLetterStatementCategory, Guid>>();
        }
    
        /// <summary>
        /// Returns a list of all questions that are not specific to a client.
        /// </summary>
        /// <returns></returns>
        public List<QuestionViewModel> GetCompleteSetOfQuestions()
        {
            try
            {
                return _questionRepo.GetAllNonClientSpecific().Map();
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (QuestionController)).Error(ex);
                throw;
            }
        }

        /// <summary>
        /// Returns a list of client specific questions. If id not found, returns a 404 error page
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public ClientQuestionViewModel GetQuestionsByClient(string id)
        {
            try
            {
                var viewModel = new ClientQuestionViewModel();

                var clientQuestion = _questionRepo.GetByClientAccountNumber(id);

                if (clientQuestion == null || !clientQuestion.Any())
                {
                    throw new HttpResponseException(HttpStatusCode.NotFound);
                }

                viewModel.ClientId = clientQuestion.FirstOrDefault().ClientId;
                viewModel.ClientAccountNumber = clientQuestion.FirstOrDefault().ClientAccountNumber;
                viewModel.Questions = clientQuestion.Select(x => x.Question).Map();
                return viewModel;
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(QuestionController)).Error(ex);
                throw;
            }

        }

        /// <summary>
        /// Returns a list of questions grouped by CAN
        /// </summary>
        /// <returns>List of clients and their questions</returns>
        public List<ClientQuestionViewModel> GetAllClientQuestions()
        {
            var viewModel = new List<ClientQuestionViewModel>();

            var clientQuestions = _questionRepo.GetAllByClient();

            if (clientQuestions == null || !clientQuestions.Any())
            {
                throw new HttpResponseException(HttpStatusCode.NotFound);
            }

            viewModel = clientQuestions.GroupBy(x => x.ClientId)
                .Select(y => new ClientQuestionViewModel
                                 {
                                     ClientId = y.Key,
                                     ClientAccountNumber = clientQuestions.FirstOrDefault().ClientAccountNumber,
                                     Questions = y.Select(q => q.Question).Map()
                                 })
                .ToList();

            return viewModel;
        }

       [HttpGet]
        public List<AreaOfNonComplianceHeadingModel> GetAreaOfNonComplianceHeadings()
        {
            return _reportLetterStatementCategoryRepo
                        .GetAll()
                        .Select( x => new AreaOfNonComplianceHeadingModel(){ Id = x.Id, Name = x.Name, Sequence = x.Sequence})
                        .ToList();
        }

        /// <summary>
        /// Update or add new question
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage PostQuestion(AddEditQuestionViewModel model)
        {
            var question = _questionRepo.GetById(model.Id);
            var user = _userForAuditingRepository.GetSystemUser();
            var category = _categoryRepo.GetById(model.CategoryId);
            var areaOfNonComplianceHeading = _reportLetterStatementCategoryRepo.GetById(model.AreaOfNonComplianceHeadingId);
            if (question == null)
            {
                question = Question.Create(model.Id, model.Text, category, false, user);
                
            }
            else
            {
                question.Update(model.Text, model.Mandatory, category, model.Deleted, user);    
            }
            question.Deleted = model.Deleted;
            question.Mandatory = model.Mandatory;
            question.OrderNumber = model.OrderNumber;
            question.SupportingEvidence = model.SupportingEvidence;
            question.ImprovementRequired = model.ImprovementRequired;
            question.ActionRequired = model.ActionRequired;

            question.IsAcceptableAnswerEnabled = model.AcceptableEnabled;
            question.IsUnacceptableAnswerEnabled = model.UnacceptableEnabled;
            question.IsImprovementRequiredAnswerEnabled = model.ImprovementRequiredEnabled;
            question.IsNotApplicableAnswerEnabled = model.NotApplicableEnabled;

            question.GuidanceNotes = model.GuidanceNotes;
            question.AreaOfNonCompliance = model.AreaOfNonCompliance;
            question.AreaOfNonComplianceHeading = areaOfNonComplianceHeading;
                                
                
            foreach( Guid industryId in model.Industries.IndustryIds )
            {                    
                question.AddIndustry( _industryRepository.GetById( industryId ), user);
            }

                question.Industries.Where(x => !model.Industries.IndustryIds.Contains(x.ChecklistTemplate.Id))
            .ToList()
                    .ForEach(x => question.RemoveIndustry(x.ChecklistTemplate, user));
               
            _questionRepo.SaveOrUpdate(question);

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [HttpGet]
        public AddEditQuestionViewModel Get(Guid id)
        {
            var question = _questionRepo.GetById(id);

            var questionViewModel = new AddEditQuestionViewModel();
            questionViewModel.Id = question.Id;
            questionViewModel.Text = question.Title;
            questionViewModel.Mandatory = question.Mandatory;
            questionViewModel.AcceptableEnabled = question.IsAcceptableAnswerEnabled;
            questionViewModel.UnacceptableEnabled = question.IsUnacceptableAnswerEnabled;
            questionViewModel.ImprovementRequiredEnabled = question.IsImprovementRequiredAnswerEnabled;
            questionViewModel.NotApplicableEnabled = question.IsNotApplicableAnswerEnabled;
            questionViewModel.CategoryId = question.Category.Id;
            questionViewModel.Deleted = question.Deleted;
            questionViewModel.SupportingEvidence = question.SupportingEvidence;
            questionViewModel.ActionRequired = question.ActionRequired;
            questionViewModel.ImprovementRequired = question.ImprovementRequired;
            questionViewModel.GuidanceNotes = question.GuidanceNotes;
            questionViewModel.OrderNumber = question.OrderNumber;
            questionViewModel.Industries.IndustryIds = question.Industries.Where(x=>!x.Deleted).Select(x => x.ChecklistTemplate.Id).ToList();
            questionViewModel.Industries.QuestionId = question.Id;
            questionViewModel.AreaOfNonCompliance = question.AreaOfNonCompliance;
            questionViewModel.AreaOfNonComplianceHeadingId = question.AreaOfNonComplianceHeading != null ? question.AreaOfNonComplianceHeading.Id : Guid.Empty;
            questionViewModel.AreaOfNonComplianceHeadings = GetAreaOfNonComplianceHeadings();
            questionViewModel.IndustryTemplates = _industryRepository.GetAll().Select(x => new IndustryViewModel(){Id =  x.Id, Title = x.Name, Deleted = x.Deleted}).ToList();
                                                                                        
            return questionViewModel;
        }

        [HttpGet]
        public int GetQuestionNextOrderNumber()
        {
            try
            {
                var nextOrderNumber = _questionRepo.GetAllNonClientSpecific().Max(x => x.OrderNumber);
                return ++nextOrderNumber;
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(QuestionController)).Error(ex);
                throw;
            }
        }
        
        /// <summary>
        /// Update question order
        /// </summary>
        /// <param name="questionsOrder"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage UpdateQuestionOrder(List<QuestionOrderViewModel> questionsOrder)
        {
            try
            {
                foreach (var questionOrderViewModel in questionsOrder.ToList())
                {
                    var question = _questionRepo.GetById(questionOrderViewModel.QuestionId);
                    question.OrderNumber = questionOrderViewModel.OrderNumber;
                    _questionRepo.SaveOrUpdate(question);
                }
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(QuestionController)).Error(ex);
                throw;
            }

            return Request.CreateResponse(HttpStatusCode.OK);
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
