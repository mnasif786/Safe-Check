using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.ServiceModel;
using System.ServiceModel.Channels;
using System.Threading;
using System.Web;
using System.Web.Helpers;
using System.Web.Http;
using System.Xml.Linq;
using BusinessSafe.Application.RestAPI.Responses;
using BusinessSafe.Data.Queries.SafeCheck;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.InfrastructureContracts.Logging;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using BusinessSafe.Infrastructure.Security;
using BusinessSafe.Messages.Emails.Commands;
using EvaluationChecklist.ClientDetails;
using EvaluationChecklist.ClientDocumentService;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Mappers;
using EvaluationChecklist.Models;
using System.Linq;
using EvaluationChecklist.SecurityService;
using NHibernate.Linq;
using NServiceBus;
using log4net;
using Peninsula.Online.Data.NHibernate.ApplicationServices;
using StructureMap;
using IQuestionRepository = BusinessSafe.Domain.RepositoryContracts.SafeCheck.IQuestionRepository;
using BusinessSafe.Domain.ParameterClasses.SafeCheck;
using Checklist = BusinessSafe.Domain.Entities.SafeCheck.Checklist;
using CompanyDetails = EvaluationChecklist.ClientDetails.Models.CompanyDetails;
using Question = BusinessSafe.Domain.Entities.SafeCheck.Question;

namespace EvaluationChecklist.Controllers
{
    [Authorize]
    public class ChecklistController : ApiController
    {
        private readonly ICheckListRepository _checklistRepository;
        private readonly IQuestionRepository _questionRepository;
        private readonly IQuestionResponseRepository _questionResponseRepository;
        private readonly IClientDetailsService _clientDetailsService;
        private readonly IGetChecklistsQuery _getChecklistsQuery;
        private readonly IChecklistQuestionRepository _checklistQuestionRepository;
        private readonly IEmployeeRepository _employeeRespository;
        private readonly IImpressionTypeRepository _impressionRespository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ITimescaleRepository _timescaleRepository;
        private readonly IUserForAuditingRepository _userForAuditingRepository;
        private readonly ISiteRepository _siteRepository;
        private readonly IChecklistPdfCreator _checklistPdfCreator;
        private readonly IClientDocumentationChecklistPdfWriter _clientDocumentationChecklistPdfWriter;
        private readonly IPeninsulaLog _log;
        private readonly IQaAdvisorRepository _qaAdvisorRepository;
        private readonly IChecklistTemplateRepository _industryRepository;
        private readonly IQualityControlService _qualityControlService;
        private readonly IBus _bus;
        private readonly IBusinessSafeSessionManager _businessSafeSessionManager;
        private readonly IChecklistService _checklistService;
        private readonly IUserIdentityFactory _userIdentityFactory;

        private static object _lock = new object();

        /// <summary>
        /// 
        /// </summary>
        /// <param name="dependencyFactory"></param>
        public ChecklistController(IDependencyFactory dependencyFactory)
        {
            _checklistRepository = dependencyFactory.GetInstance<ICheckListRepository>();
            _questionRepository = dependencyFactory.GetInstance<IQuestionRepository>();
            _questionResponseRepository = dependencyFactory.GetInstance<IQuestionResponseRepository>();
            _clientDetailsService = dependencyFactory.GetInstance<IClientDetailsService>();
            _getChecklistsQuery = dependencyFactory.GetInstance<IGetChecklistsQuery>();
            _checklistQuestionRepository = dependencyFactory.GetInstance<IChecklistQuestionRepository>();
            _employeeRespository = dependencyFactory.GetInstance<IEmployeeRepository>();
            _impressionRespository = dependencyFactory.GetInstance<IImpressionTypeRepository>();
            _categoryRepository = dependencyFactory.GetInstance<ICategoryRepository>();
            _timescaleRepository = dependencyFactory.GetInstance<ITimescaleRepository>();
            _userForAuditingRepository = dependencyFactory.GetInstance<IUserForAuditingRepository>();
            _siteRepository = dependencyFactory.GetInstance<ISiteRepository>();
            _checklistPdfCreator = dependencyFactory.GetInstance<IChecklistPdfCreator>();
            _clientDocumentationChecklistPdfWriter =
                dependencyFactory.GetInstance<IClientDocumentationChecklistPdfWriter>();
            _log = dependencyFactory.GetInstance<IPeninsulaLog>();
            _qaAdvisorRepository = dependencyFactory.GetInstance<IQaAdvisorRepository>();
            _industryRepository = dependencyFactory.GetInstance<IChecklistTemplateRepository>();
            _qualityControlService = dependencyFactory.GetInstance<IQualityControlService>();
            _bus = dependencyFactory.GetInstance<IBus>();
            _businessSafeSessionManager = dependencyFactory.GetInstance<IBusinessSafeSessionManager>();
            _checklistService = dependencyFactory.GetInstance<IChecklistService>();
            _userIdentityFactory = dependencyFactory.GetInstance<IUserIdentityFactory>();
        }

        /// <summary>
        /// Returns a checklist given an Id. Will return 404 error if not found.
        /// </summary>
        /// <param name="id">integer</param>
        /// <returns></returns>
        public ChecklistViewModel GetChecklist(Guid id)
        {
            try
            {
                _log.Add(new[] {id});

                var checklist = _checklistRepository.GetById(id);
                
                if (checklist == null)
                {
                    throw new HttpResponseException(HttpStatusCode.NotFound);
                }

                var model = new ChecklistViewModel();
                model.Id = checklist.Id;
                model.ClientId = checklist.ClientId;
                model.SiteId = checklist.SiteId.HasValue ? (int?) checklist.SiteId.Value : null;
                model.Site = checklist.SiteId.HasValue ? new SiteViewModel() {Id = checklist.SiteId.Value} : null;
                model.CoveringLetterContent = checklist.CoveringLetterContent;
                model.LastModifiedOn = checklist.LastModifiedOn.ToUniversalTime();

                model.CreatedOn = checklist.CreatedOn;
                model.Status = checklist.Status;
                model.ImmediateRiskNotifications = ImmediateRiskNotificationViewModelMapper.Map(checklist.ImmediateRiskNotifications);

                model.SiteVisit = MapToSiteVisitViewModel(checklist);

                if (checklist.ImpressionType != null)
                {
                    model.SiteVisit.SelectedImpressionType = new ImpressionTypeViewModel()
                    {
                        Id = checklist.ImpressionType.Id,
                        Comments = checklist.ImpressionType.Comments,
                        Title = checklist.ImpressionType.Title
                    };
                }

                model.Categories = checklist.Questions.DistinctListOfCategories();

                model.Questions = checklist.Questions.Where(q => !q.Deleted).Select(q =>
                {
                    var correspondingAnswer = checklist.Answers.FirstOrDefault(a => a.Question.Id == q.Question.Id);
                    return new QuestionAnswerViewModel()
                    {
                        Question = q.Question.Map(),
                        Answer = Map(correspondingAnswer, q.Question),
                        QuestionNumber = (q.QuestionNumber == null) ? 0 : q.QuestionNumber.Value,
                        CategoryNumber = (q.CategoryNumber == null) ? 0 : q.CategoryNumber.Value
                    };
                }).Distinct().OrderBy(x => x.Question.OrderNumber).ToList();

                model.CreatedOn = checklist.ChecklistCreatedOn.ToUniversalTime();
                model.CreatedBy = checklist.ChecklistCreatedBy;
                model.CompletedOn = checklist.ChecklistCompletedOn.ToUniversalTime();
                model.CompletedBy = checklist.ChecklistCompletedBy;
                model.SubmittedOn = checklist.ChecklistSubmittedOn.ToUniversalTime();
                model.SubmittedBy = checklist.ChecklistSubmittedBy;
                model.IndustryId = checklist.ChecklistTemplate != null ? checklist.ChecklistTemplate.Id : (Guid?) null;
                model.QAComments = checklist.QAComments;
                model.EmailReportToPerson = checklist.EmailReportToPerson;
                model.EmailReportToOthers = checklist.EmailReportToOthers;
                model.PostReport = checklist.PostReport;
                model.OtherEmailAddresses = checklist.OtherEmailAddresses;
                model.UpdatesRequired = checklist.UpdatesRequired;
                model.ExecutiveSummaryUpdateRequired = checklist.ExecutiveSummaryUpdateRequired;
                model.ExecutiveSummaryQACommentsResolved = checklist.ExecutiveSummaryQACommentsResolved;
                model.ExecutiveSummaryQASignedOffBy = checklist.ExecutiveSummaryQACommentsSignedOffBy;
                model.ExecutiveSummaryQASignedOffDate = checklist.ExecutiveSummaryQACommentsSignedOffDate.ToUniversalTime();
                model.ReportHeaderType = checklist.ReportHeaderType.ToString();

                model.PersonsSeen = checklist.PersonsSeen.Map();

                model.IncludeActionPlan = checklist.IncludeActionPlan;
                model.IncludeComplianceReview = checklist.IncludeComplianceReview;
                model.Jurisdiction = checklist.Jurisdiction;
                model.OtherEmails =
                    checklist.OtherEmails.Select(
                        e => new OtherEmailsViewModel() {Id = e.Id, EmailAddress = e.EmailAddress, Name = e.Name}).ToList();

                model.ClientLogoFilename = checklist.ClientLogoFilename;
                model.Favourite = checklist.Deleted == false ? GetFavouriteChecklist(checklist.Id): null;
                model.Deleted = checklist.Deleted;
                model.ClientSiteGeneralNotes = checklist.ClientSiteGeneralNotes;
                model.SpecialReport = checklist.SpecialReport;

                return model;
            }
            catch (HttpResponseException)
            {
                throw; //dont log http response exceptions
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }
        }


        private static SiteVisitViewModel MapToSiteVisitViewModel(Checklist checklist)
        {
            return new SiteVisitViewModel()
            {
                VisitBy = string.IsNullOrEmpty(checklist.VisitBy) ? string.Empty : checklist.VisitBy,
                VisitType = checklist.VisitType,
                VisitDate = checklist.VisitDate.HasValue ? (DateTime?) checklist.VisitDate.Value.ToUniversalTime(): null,
                AreasNotVisited = checklist.AreasNotVisited,
                AreasVisited = checklist.AreasVisited,
                EmailAddress = checklist.EmailAddress,
                PersonSeen = new PersonSeenViewModel()
                {
                    Name = checklist.MainPersonSeenName,
                    Id = checklist.MainPersonSeen != null ? checklist.MainPersonSeen.Id : Guid.Empty
                },
            };
        }

        private static AnswerViewModel Map(ChecklistAnswer answer, Question question)
        {
            if (answer != null)
            {
                AnswerViewModel model = new AnswerViewModel()
                {
                    SupportingEvidence = answer.SupportingEvidence,
                    ActionRequired = answer.ActionRequired,
                    SelectedResponseId = answer.Response != null ? (Guid?) answer.Response.Id : null,
                    QuestionId = answer.Question.Id,
                    GuidanceNotes = answer.GuidanceNotes,
                    Timescale =
                        answer.Timescale == null
                            ? null
                            : new TimescaleViewModel() {Id = answer.Timescale.Id, Name = answer.Timescale.Name},
                    AssignedTo = null,
                    QaComments = answer.QaComments,
                    QaSignedOffBy = answer.QaSignedOffBy,
                    QaSignedOffDate = answer.QaSignedOffDate,
                    ReportLetterStatement = answer.Response != null ? answer.Response.ReportLetterStatement : "",
                    QaCommentsResolved = answer.QaCommentsResolved,
                    AreaOfNonCompliance = answer.AreaOfNonCompliance,
                    SupportingDocumentationStatus = answer.SupportingDocumentationStatus,
                    SupportingDocumentationDate = answer.SupportingDocumentationDate.ToUniversalTime()

                };

                if (answer.AssignedTo != null)
                {
                    model.AssignedTo = new AssignedToViewModel()
                    {
                        Id = (Guid?) answer.AssignedTo.Id,
                        ForeName = answer.AssignedTo.Forename,
                        Surname = answer.AssignedTo.Surname,
                        FullName = answer.AssignedTo.FullName,
                        EmailAddress = answer.AssignedTo.HasEmail ? answer.AssignedTo.GetEmail() : string.Empty
                    };
                }
                else if (!string.IsNullOrEmpty(answer.EmployeeNotListed))
                {
                    model.AssignedTo = new AssignedToViewModel()
                    {
                        Id = (Guid?) Guid.Empty,
                        NonEmployeeName = answer.EmployeeNotListed
                    };
                }

                return model;
            }
            else
            {
                return new AnswerViewModel()
                {
                    QuestionId = question.Id
                };
            }
        }

        [HttpPost]
        public HttpResponseMessage DeleteChecklist(Guid id)
        {
            try
            {

                var peninsulaUsername = new UserLoginProvider().GetUserLogin();

                //Using load instead of get because the get by id inner joins to the question table
                //Therefore if a checklist has not questions then the getbyId method will return null. We need to be able to delete checklists that have no questions.
                var checklist = _checklistRepository.LoadById(id);
                //this method will throw an exception if entity doesnt exist. 

                if (checklist != null)
                {
                    var user = _userForAuditingRepository.GetSystemUser();
                    checklist.MarkForDelete(user, peninsulaUsername);
                    _checklistRepository.Save(checklist);
                }

                return Request.CreateResponse(HttpStatusCode.OK);

            }
            catch (NHibernate.ObjectNotFoundException)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Creates/Updates the checklist. The id is a Guid. To create a new checklist generate a new Guid. 
        /// </summary>
        /// <param name="id">Guid</param>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage PostChecklist(Guid id, ChecklistViewModel model)
        {
            
            lock (_lock)
            {
                //PostChecklistViewModel returnModel = new PostChecklistViewModel();
                
                try
                {
                    LogManager.GetLogger(typeof (ChecklistController))
                        .Info("Starting PostChecklist on Thread " + Thread.CurrentThread.ManagedThreadId);
                    _log.Add(model);

                    if (!ModelState.IsValid || model == null)
                    {
                        var errorList = ModelState.Keys.ToList()
                            .Select(k => new {PropertyName = k, Errors = ModelState[k].Errors})
                            .Where(e => e.Errors.Count > 0);

                        var errorlistItems = errorList.ToList();
                        throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.BadRequest, errorList));
                    }

                    // SGG: BODGE until we support IncludeActionPlan/ComplianceReview
                    model.IncludeActionPlan = true;
                    model.IncludeComplianceReview = true;

                    if (HttpContext.Current != null)
                    {
                        model.ContentPath = string.Format("{0}://{1}{2}", HttpContext.Current.Request.Url.Scheme,
                            HttpContext.Current.Request.Url.Authority, "/content");
                    }

                    var user = _userForAuditingRepository.GetSystemUser();

                    bool ChecklistMarkedAsDeletedOnServer = false;
                    Checklist checklist = _checklistRepository.GetById(id);
                    if (checklist != null && checklist.Deleted && checklist.Status == Checklist.STATUS_DRAFT)
                    {
                        ChecklistMarkedAsDeletedOnServer = checklist.Deleted;
                     
                        // if saving draft to previously deleted report, restore report
                        checklist.Deleted = false;
                        checklist.DeletedBy = null;
                        checklist.DeletedOn = null;                        
                    }

                    checklist = CreateUpdateChecklist(checklist, model, user);                   
                    
                    AddRemovePersonsSeen(checklist, model.PersonsSeen);

                    AddRemoveOtherEmails(checklist, model.OtherEmails);

                    UpdateQuestions(checklist, model, user);

                    var checklistAnswers = ChecklistAnswers(checklist, model, user);
                    checklist.UpdateAnswers(checklistAnswers, user);

                    
                    if (checklist.ActionPlan != null)
                    {
                        checklist.ActionPlan.CreateActions(checklistAnswers);
                        checklist.ActionPlan.CreateImmediateRiskNotifications();
                    }
                   
                    if (model.Submit)
                    {
                        SetPreviousChecklistActionTasksToNotRequired(model);

                        SubmitChecklist(model, user, checklist);

                        SendSubmitChecklistEmails(checklist);
                    }
                    else
                    {
                        _qualityControlService.AutoAssignChecklist(checklist);

                        _checklistRepository.SaveOrUpdate(checklist);
                        _checklistRepository.Flush();                       

                        if (model.Status == Checklist.STATUS_COMPLETED)
                        {
                            SendIRNNotificationEmail(checklist);
                        }
                    }
                    
                    return Request.CreateResponse(HttpStatusCode.OK, new { checklist.LastModifiedOn, ChecklistMarkedAsDeletedOnServer });
                }
                catch (HttpResponseException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    _businessSafeSessionManager.Rollback();
                    LogManager.GetLogger(typeof (ChecklistController))
                        .Error("Error on thread" + Thread.CurrentThread.ManagedThreadId, ex);
                    LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                    throw;
                }
                finally
                {
                    LogManager.GetLogger(typeof (ChecklistController))
                        .Info("Exiting PostChecklist on thread " + Thread.CurrentThread.ManagedThreadId);
                }
            }
        }

        private void SendIRNNotificationEmail(Checklist checklist)
        {
            if (checklist.ImmediateRiskNotifications.Count > 0)
            {
                var clientDetails = new List<CompanyDetails>();
                string can = GetClientAccountNumber(clientDetails, checklist.ClientId);

                _bus.Send(new SendIRNNotificationEmail() {ChecklistId = checklist.Id, CAN = can});
            }
        }

        private void SetPreviousChecklistActionTasksToNotRequired(ChecklistViewModel model)
        {
            if (model.ClientId.HasValue)
            {
                var previousChecklists =
                    _checklistRepository.GetByClientId(model.ClientId.Value)
                        .Where( x => model.SiteId == x.SiteId &&  x.Status == "Submitted" && model.Id != x.Id );

                foreach (Checklist prevChecklist in previousChecklists)
                {
                    if (prevChecklist.ActionPlan != null)
                    {
                        prevChecklist.ActionPlan.NoLongerRequired = true;

                        foreach (var previousChecklistAction in prevChecklist.ActionPlan.Actions)
                        {
                            foreach (var task in previousChecklistAction.ActionTasks)
                            {
                                if (task.TaskStatus != TaskStatus.Completed)
                                    task.TaskStatus = TaskStatus.NoLongerRequired;
                            }

                            previousChecklistAction.NoLongerRequired = true;
                        }

                        _checklistRepository.SaveOrUpdate(prevChecklist);
                    }
                }
            }
        }

        private void SendSubmitChecklistEmails(Checklist checklist)
        {
            _checklistRepository.SaveOrUpdate(checklist);
            _checklistRepository.Flush();

            // close the session to commit the transaction so that the new values can be accessed when generating the emails
            if (_businessSafeSessionManager != null)
                _businessSafeSessionManager.CloseSession();

            if (checklist.EmailReportToPerson || (checklist.EmailReportToOthers && checklist.OtherEmails.Any()))
            {
                _bus.Send(new SendSubmitChecklistEmail() {ChecklistId = checklist.Id});
            }

            if (checklist.PostReport)
            {
                var clientDetails = new List<CompanyDetails>();
                string can = GetClientAccountNumber(clientDetails, checklist.ClientId);
             
                 var site = checklist.SiteId.HasValue
                        ? _clientDetailsService.GetSite(checklist.ClientId.Value, checklist.SiteId.Value)
                        : null;
              
                SendHardCopyToOfficeEmail email = new SendHardCopyToOfficeEmail()
                                                      {
                                                          CAN = can,
                                                          ChecklistId = checklist.Id,                                                          
                                                          VisitDate = checklist.VisitDate,
                                                          VisitBy = checklist.ChecklistCompletedBy,
                                                          SubmittedBy = checklist.ChecklistSubmittedBy,
                                                          SubmittedDate = checklist.ChecklistSubmittedOn,
                                                          SiteName = site != null ? site.SiteName : "",
                                                          SiteAddressLine1 = site != null ? site.Address1 : "",
                                                          SiteAddressLine2 = site != null ? site.Address2 : "",
                                                          SiteAddressLine3 = site != null ? site.Address3 : "",
                                                          SiteAddressLine4 = site != null ? site.Address4 : "",
                                                          SiteAddressLine5 = site != null ? site.Address5 : "",
                                                          SitePostcode = site != null ? site.Postcode  : ""
                                                      };
                
                _bus.Send(email);
            }           
        }

        /// <summary>
        /// Hack-y method to allow Submitted PDF reports to be regenerated. Action plan items should not be updated.
        /// Needs a LOT of work before being used in live environment
        /// </summary>
        /// <param name="id">Checklist ID</param>
        /// <param name="model">Checklist Model</param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage UpdatePDF(Guid id, ChecklistViewModel model)
        {
            try
            {
                LogManager.GetLogger(typeof (ChecklistController)).Info("Starting UpdatePDF on Thread " +
                                                                        Thread.CurrentThread.ManagedThreadId);
                _log.Add(model);

                if (!ModelState.IsValid || model == null)
                {
                    var errorList = ModelState.Keys.ToList()
                        .Select(k => new {PropertyName = k, Errors = ModelState[k].Errors})
                        .Where(e => e.Errors.Count > 0);

                    var errorlistItems = errorList.ToList();
                    throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.BadRequest, errorList));
                }

                var user = _userForAuditingRepository.GetSystemUser();

                var checklist = _checklistRepository.GetById(id);

                long? oldDocumentID = checklist.ExecutiveSummaryDocumentLibraryId;

                if (HttpContext.Current != null)
                {
                    model.ContentPath = string.Format("{0}://{1}{2}", HttpContext.Current.Request.Url.Scheme,
                        HttpContext.Current.Request.Url.Authority, "/content");
                }

                checklist.CoveringLetterContent = model.CoveringLetterContent;

                // SGG: BODGE until we support IncludeActionPlan/ComplianceReview
                model.IncludeActionPlan = true;
                model.IncludeComplianceReview = true;
                _checklistPdfCreator.ChecklistViewModel = model;

                checklist.Title = string.Format("Visit Report - {0} - {1} - {2:dd/MM/yyyy}", model.Site.Address1,
                    model.Site.Postcode, model.SiteVisit.VisitDate);


                var pdfBytes = _checklistPdfCreator.GetBytes();
                long documentId =
                    _clientDocumentationChecklistPdfWriter.WriteToClientDocumentation(
                        checklist.Title.Replace("/", "") + ".pdf",
                        pdfBytes,
                        model.ClientId.Value,
                        model.SiteId);
                checklist.ExecutiveSummaryDocumentLibraryId = documentId;

                if (checklist.ActionPlan != null)
                {
                    checklist.ActionPlan.ExecutiveSummaryDocumentLibraryId = documentId;
                    checklist.ActionPlan.LastModifiedBy = user;
                    checklist.ActionPlan.LastModifiedOn = DateTime.Now;
                    checklist.ActionPlan.VisitBy = model.CompletedBy;
                };

                _checklistRepository.SaveOrUpdate(checklist);
                _checklistRepository.Flush();

                LogManager.GetLogger(typeof (ChecklistController))
                    .Info(string.Format("Updated PDF - checklist id:{0} oldPDFId:{1} newPDFId:{2}",
                        checklist.Id, oldDocumentID.HasValue ? oldDocumentID.Value : 0,
                        documentId));

                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (HttpResponseException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof (ChecklistController))
                    .Error("Error on thread" + Thread.CurrentThread.ManagedThreadId, ex);
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }
            finally
            {
                LogManager.GetLogger(typeof (ChecklistController))
                    .Info("Exiting UpdatePDF on thread " + Thread.CurrentThread.ManagedThreadId);
            }
        }

        private void SubmitChecklist(ChecklistViewModel model, UserForAuditing user, Checklist checklist)
        {
            // SGG: BODGE until we support IncludeActionPlan/ComplianceReview
            model.IncludeActionPlan = !checklist.SpecialReport;
            model.IncludeComplianceReview = !checklist.SpecialReport;

            _checklistPdfCreator.ChecklistViewModel = model;
            var pdfBytes = _checklistPdfCreator.GetBytes();
            long? documentId =
                _clientDocumentationChecklistPdfWriter.WriteToClientDocumentation(
                    checklist.Title.Replace("/", "") + ".pdf",
                    pdfBytes,
                    model.ClientId.Value,
                    model.SiteId);
            
            checklist.ExecutiveSummaryDocumentLibraryId = documentId;

            if (!checklist.SpecialReport)
            {
                checklist.ActionPlan.ExecutiveSummaryDocumentLibraryId = documentId;
                checklist.ActionPlan.LastModifiedBy = user;
                checklist.ActionPlan.LastModifiedOn = DateTime.Now;
                checklist.ActionPlan.VisitBy = model.CompletedBy;    
            }

            LogManager.GetLogger(typeof (ChecklistController))
                .Info(string.Format("Submitted checklist id:{0} pdfId:{1}", checklist.Id,
                    documentId.HasValue ? documentId.Value : 0));
        }

        private Checklist CreateUpdateChecklist(Checklist checklist, ChecklistViewModel model, UserForAuditing user)
        {         
            var createUpdateChecklistParameters = CreateUpdateChecklistParameters(model, user);

            if (checklist == null)
            {
                checklist = Checklist.Create(createUpdateChecklistParameters);
            }
            else
            {
                if (checklist.Status == Checklist.STATUS_SUBMITTED)
                {
                    throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.Forbidden));
                }               

                checklist.UpdateChecklistDetails(createUpdateChecklistParameters);
            }
            return checklist;
        }

        private static List<Question> GetAllQuestions(Checklist checklist)
        {
            return checklist.Questions.Select(checklistQuestion => checklistQuestion.Question).Distinct().ToList();
        }

        private static List<QuestionResponse> GetAllResponses(Checklist checklist)
        {
            return checklist.Questions.SelectMany(checklistQuestion => checklistQuestion.Question.PossibleResponses)
                .Distinct()
                .ToList();
        }

        private List<ChecklistAnswer> ChecklistAnswers(Checklist checklist, ChecklistViewModel model,
            UserForAuditing user)
        {
            var allResponses = GetAllResponses(checklist);
            var allQuestions = GetAllQuestions(checklist);

            var checklistAnswers = new List<ChecklistAnswer>();

            foreach (var questionAnswerViewModel in model.Questions.Where(x => x.Answer != null))
            {
                var checklistAnswer = new ChecklistAnswer();
                checklistAnswer.SupportingEvidence = questionAnswerViewModel.Answer.SupportingEvidence;
                checklistAnswer.ActionRequired = questionAnswerViewModel.Answer.ActionRequired;
                checklistAnswer.GuidanceNotes = questionAnswerViewModel.Answer.GuidanceNotes;
                checklistAnswer.Timescale = questionAnswerViewModel.Answer.Timescale != null
                    ? _timescaleRepository.GetById(questionAnswerViewModel.Answer.Timescale.Id)
                    : null;
                checklistAnswer.Response =
                    allResponses.SingleOrDefault(
                        response => response.Id == questionAnswerViewModel.Answer.SelectedResponseId);
                checklistAnswer.Question =
                    allQuestions.Single(question => question.Id == questionAnswerViewModel.Question.Id);
                checklistAnswer.AssignedTo = AssignedToHasValue(questionAnswerViewModel)
                    ? _employeeRespository.GetById((questionAnswerViewModel.Answer.AssignedTo.Id.GetValueOrDefault()))
                    : null;
                checklistAnswer.EmployeeNotListed = (questionAnswerViewModel.Answer.AssignedTo != null) &&
                                                    (questionAnswerViewModel.Answer.AssignedTo.Id.HasValue) &&
                                                    (questionAnswerViewModel.Answer.AssignedTo.Id.Value == Guid.Empty)
                    ? questionAnswerViewModel.Answer.AssignedTo.NonEmployeeName
                    : null;

                checklistAnswer.QaComments = questionAnswerViewModel.Answer.QaComments;
                checklistAnswer.QaCommentsResolved = questionAnswerViewModel.Answer.QaCommentsResolved;
                checklistAnswer.AreaOfNonCompliance = questionAnswerViewModel.Answer.AreaOfNonCompliance;

                if (questionAnswerViewModel.Answer.QaSignedOffBy != null)
                {

                    if (IsOldQaSignedOffFormat(questionAnswerViewModel))
                    {
                        checklistAnswer.QaSignedOffBy = GetQaAdvisorFromOldQaSignedOffFormat(questionAnswerViewModel);
                        checklistAnswer.QaSignedOffDate =
                            GetSignOffDateFromOldQaSignedOffFormat(questionAnswerViewModel).HasValue
                                ? GetSignOffDateFromOldQaSignedOffFormat(questionAnswerViewModel).Value
                                : DateTime.Now;
                    }
                    else
                    {
                        checklistAnswer.QaSignedOffBy = questionAnswerViewModel.Answer.QaSignedOffBy;
                        checklistAnswer.QaSignedOffDate = questionAnswerViewModel.Answer.QaSignedOffDate.HasValue
                            ? questionAnswerViewModel.Answer.QaSignedOffDate.Value.ToLocalTime()
                            : DateTime.Now;
                    }
                }

                checklistAnswer.CreatedBy = user;
                checklistAnswer.CreatedOn = DateTime.Now;
                checklistAnswer.LastModifiedBy = user;
                checklistAnswer.LastModifiedOn = DateTime.Now;
                checklistAnswer.SupportingDocumentationStatus = questionAnswerViewModel.Answer.SupportingDocumentationStatus;
                checklistAnswer.SupportingDocumentationDate = questionAnswerViewModel.Answer.SupportingDocumentationDate.ToLocalTime();

                checklistAnswers.Add(checklistAnswer);
            }
            return checklistAnswers;
        }

        private static bool AssignedToHasValue(QuestionAnswerViewModel questionAnswerViewModel)
        {
            return (questionAnswerViewModel.Answer.AssignedTo != null) &&
                   (questionAnswerViewModel.Answer.AssignedTo.Id.HasValue) &&
                   (questionAnswerViewModel.Answer.AssignedTo.Id.Value != Guid.Empty);
        }


        /// <summary>
        /// the old version of Qa Signed off was in the format David Brierley_06/12/2013 00:00:00_09/12/2013 00:00:00_09/12/2013 00:00:00_09/12/2013 00:00:00
        /// the new version is David Brierley
        /// </summary>
        /// <param name="questionAnswerViewModel"></param>
        /// <returns></returns>
        private static bool IsOldQaSignedOffFormat(QuestionAnswerViewModel questionAnswerViewModel)
        {
            var qa = questionAnswerViewModel.Answer.QaSignedOffBy.Split('_');

            return qa.Length > 1;
        }

        private static string GetQaAdvisorFromOldQaSignedOffFormat(QuestionAnswerViewModel questionAnswerViewModel)
        {
            return questionAnswerViewModel.Answer.QaSignedOffBy.Split('_')[0];
        }

        private static DateTime? GetSignOffDateFromOldQaSignedOffFormat(QuestionAnswerViewModel questionAnswerViewModel)
        {
            DateTime signOffDate;
            if (DateTime.TryParse(questionAnswerViewModel.Answer.QaSignedOffBy.Split('_')[1], out signOffDate))
            {
                return signOffDate;
            }
            else
            {
                return null;
            }
        }


        private CreateUpdateChecklistParameters CreateUpdateChecklistParameters(ChecklistViewModel model,
            UserForAuditing user)
        {
            var parameters = new CreateUpdateChecklistParameters();
          
            parameters.Id = model.Id;
            parameters.ClientId = model.ClientId;
            parameters.SiteId = model.SiteId;
            parameters.CoveringLetterContent = model.CoveringLetterContent;
            parameters.Status = model.Status;
            parameters.Submit = model.Submit;
            parameters.User = user;
            parameters.Site = _siteRepository.GetByPeninsulaSiteId((long) model.SiteId);

            parameters.CreatedOn = model.CreatedOn;
            parameters.CreatedBy = model.CreatedBy;
            parameters.CompletedOn = model.CompletedOn.ToLocalTime();
            parameters.CompletedBy = model.CompletedBy;
            parameters.SubmittedOn = model.SubmittedOn.ToLocalTime();
            parameters.SubmittedBy = model.SubmittedBy;
            parameters.PostedBy = model.PostedBy;
            parameters.ChecklistTemplate = model.IndustryId.HasValue
                ? _industryRepository.LoadById(model.IndustryId.Value)
                : null;
            parameters.QAComments = model.QAComments;
            parameters.LastModifiedOn = model.LastModifiedOn.ToLocalTime();
            parameters.EmailReportToPerson = model.EmailReportToPerson.HasValue && model.EmailReportToPerson.Value;
            parameters.EmailReportToOthers = model.EmailReportToOthers.HasValue && model.EmailReportToOthers.Value;
            parameters.PostReport = model.PostReport.HasValue && model.PostReport.Value;
            parameters.OtherEmailAddresses = model.OtherEmailAddresses;
            parameters.ReportHeader = string.IsNullOrEmpty(model.ReportHeaderType)
                ? SummaryReportHeaderType.None
                : (SummaryReportHeaderType)
                    Enum.Parse(typeof (SummaryReportHeaderType), model.ReportHeaderType);

            // SGG: Comment out until we support the functionality
            //parameters.IncludeActionPlan = model.IncludeActionPlan;
            //parameters.IncludeComplianceReview = model.IncludeComplianceReview;

            parameters.IncludeActionPlan = true;
            parameters.IncludeComplianceReview = true;

            //parameters.Deleted = model.Deleted;
            //parameters.DeletedBy = model.DeletedBy;
            //parameters.DeletedOn = model.DeletedOn;          

            parameters.ExecutiveSummaryUpdateRequired = model.ExecutiveSummaryUpdateRequired;
            parameters.ExecutiveSummaryQACommentsResolved = model.ExecutiveSummaryQACommentsResolved;
            parameters.ExecutiveSummaryQACommentsSignedOffBy = model.ExecutiveSummaryQASignedOffBy;
            parameters.ExecutiveSummaryQACommentsSignedOffDate = model.ExecutiveSummaryQASignedOffDate.ToLocalTime();

            parameters.ClientLogoFilename = model.ClientLogoFilename;
            parameters.ClientSiteGeneralNotes = model.ClientSiteGeneralNotes;
            parameters.SpecialReport = model.SpecialReport;

            if (model.SiteVisit != null)
            {
                parameters.VisitDate = model.SiteVisit.VisitDate.HasValue
                    ? model.SiteVisit.VisitDate.Value.ToLocalTime().ToString("dd/MM/yyyy")
                    : null;
                parameters.VisitBy = model.SiteVisit.VisitBy;
                parameters.VisitType = model.SiteVisit.VisitType;

                if (model.SiteVisit.PersonSeen != null)
                {
                    if (model.SiteVisit.PersonSeen.Id == null)
                    {
                        parameters.MainPersonSeen = null;
                        parameters.MainPersonSeenName = null;
                    }
                    else if (model.SiteVisit.PersonSeen.Id == Guid.Empty)
                    {
                        parameters.MainPersonSeen = null;
                        parameters.MainPersonSeenName = model.SiteVisit.PersonSeen.Name;
                    }
                    else
                    {
                        var employee = _employeeRespository.GetById(model.SiteVisit.PersonSeen.Id.Value);
                        parameters.MainPersonSeen = employee ?? null;
                        parameters.MainPersonSeenName = model.SiteVisit.PersonSeen.Name;
                    }
                }

                parameters.AreasNotVisited = model.SiteVisit.AreasNotVisited;
                parameters.AreasVisited = model.SiteVisit.AreasVisited;
                parameters.EmailAddress = model.SiteVisit.EmailAddress;
                parameters.Jurisdiction = model.Jurisdiction;


                parameters.ImpressionType = (model.SiteVisit.SelectedImpressionType == null ||
                                             model.SiteVisit.SelectedImpressionType.Id ==
                                             Guid.Empty)
                    ? null
                    : _impressionRespository.GetById(
                        model.SiteVisit.SelectedImpressionType.Id);

                parameters.SiteAddress1 = model.Site == null ? String.Empty : model.Site.Address1;
                parameters.SiteAddressPostcode = model.Site == null
                    ? String.Empty
                    : model.Site.Postcode;
            }

            foreach (var immediateRiskNotificationViewModel in model.ImmediateRiskNotifications)
            {
                // This part updates the IRN's for storage on the checklist, retrieved in SafeCheck when not submitted
                parameters.ImmediateRiskNotifications.Add(new AddImmediateRiskNotificationParameters
                {
                    Id = immediateRiskNotificationViewModel.Id,
                    Reference = immediateRiskNotificationViewModel.Reference,
                    Title = immediateRiskNotificationViewModel.Title,
                    SignificantHazardIdentified = immediateRiskNotificationViewModel.SignificantHazard,
                    RecommendedImmediateAction = immediateRiskNotificationViewModel.RecommendedImmediate
                });
            }
            return parameters;
        }

        private void UpdateQuestions(Checklist checklist, ChecklistViewModel model, UserForAuditing systemUser)
        {
            var newQuestionAnswerViewModels = model.Questions
                .Where(
                    questionAnswerViewModel =>
                        !checklist.Questions.Any(
                            checklistQuestion => checklistQuestion.Question.Id == questionAnswerViewModel.Question.Id));

            var existingQuestions = model.Questions
                .Where(
                    questionAnswerViewModel =>
                        checklist.Questions.Any(
                            checklistQuestion => checklistQuestion.Question.Id == questionAnswerViewModel.Question.Id));

            var removedQuestions = checklist.Questions
                .Where(
                    checklistQuestion =>
                        !model.Questions.Any(qaVwModel => qaVwModel.Question.Id == checklistQuestion.Question.Id));

            newQuestionAnswerViewModels.ToList()
                .ForEach(
                    questionAnswerViewModel => AddQuestionToChecklist(checklist, questionAnswerViewModel, systemUser));

            existingQuestions.ToList()
                .ForEach(
                    questionAnswerViewModel => AddQuestionToChecklist(checklist, questionAnswerViewModel, systemUser));

            RemoveQuestions(removedQuestions, systemUser);
        }

        private void RemoveQuestions(IEnumerable<ChecklistQuestion> removedQuestions, UserForAuditing systemUser)
        {
            foreach (ChecklistQuestion q in removedQuestions)
            {
                q.MarkForDelete(systemUser);
            }
        }

        private void AddQuestionToChecklist(Checklist checklist, QuestionAnswerViewModel questionAnswerViewModel,
            UserForAuditing systemUser)
        {
            var question = _questionRepository.GetById(questionAnswerViewModel.Question.Id);

            if (question == null)
            {
                // adding a bespoke question
                var category = _categoryRepository.GetById(questionAnswerViewModel.Question.CategoryId);

                if (category == null)
                {
                    throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.BadRequest,
                        String.Format("Unknown Category - Id {0}",
                            questionAnswerViewModel.
                                Question.CategoryId.
                                ToString())));
                }

                question = Question.Create(
                    questionAnswerViewModel.Question.Id,
                    questionAnswerViewModel.Question.Text,
                    category,
                    true, // is custom (bespoke) question
                    questionAnswerViewModel.Question.SpecificToClientId,
                    questionAnswerViewModel.Question.OrderNumber,
                    systemUser);

                if (questionAnswerViewModel.Question.PossibleResponses != null)
                {
                    foreach (var possibleResponse in questionAnswerViewModel.Question.PossibleResponses)
                    {
                        var questionResponse = new QuestionResponse
                        {
                            Id = possibleResponse.Id,
                            Title = possibleResponse.Title,
                            SupportingEvidence = possibleResponse.SupportingEvidence,
                            ActionRequired = possibleResponse.ActionRequired,
                            ResponseType = possibleResponse.ResponseType,
                            GuidanceNotes = possibleResponse.GuidanceNotes,
                            CreatedBy = systemUser,
                            CreatedOn = DateTime.Now,
                            LastModifiedBy = systemUser,
                            LastModifiedOn = DateTime.Now,
                            ReportLetterStatement = possibleResponse.ReportLetterStatement
                        };

                        questionResponse.ReportLetterStatement = possibleResponse.ReportLetterStatement;

                        question.AddQuestionResponse(questionResponse);
                    }
                }

            }
            else
            {
                if (questionAnswerViewModel.Question.PossibleResponses != null)
                {
                    foreach (var possibleResponse in questionAnswerViewModel.Question.PossibleResponses)
                    {
                        // guard for non existing question response
                        var questionResponse = _questionResponseRepository.GetById(possibleResponse.Id);
                        if (questionResponse == null)
                        {
                            // if a response already exists with this title, use that.
                            if (question.PossibleResponses.Any(x => x.Title == possibleResponse.Title))
                            {
                                questionResponse =
                                    question.PossibleResponses.First((x => x.Title == possibleResponse.Title));
                            }
                        }
                        else if (question.CustomQuestion)
                        {
                            questionResponse.ReportLetterStatement = possibleResponse.ReportLetterStatement;
                        }

                        if (questionResponse != null)
                        {
                            question.AddQuestionResponse(questionResponse);
                        }
                    }
                }

                // update bespoke question text
                if (question.CustomQuestion && question.Title != questionAnswerViewModel.Question.Text)
                {
                    question.Title = questionAnswerViewModel.Question.Text;
                }
            }

            ChecklistQuestion checklistQuestion = new ChecklistQuestion()
            {
                Id = Guid.NewGuid(),
                Checklist = checklist,
                Question = question,
                CreatedBy = systemUser,
                CreatedOn = DateTime.Now,
                CategoryNumber = questionAnswerViewModel.CategoryNumber,
                QuestionNumber = questionAnswerViewModel.QuestionNumber
            };

            checklist.UpdateQuestion(checklistQuestion, systemUser);

        }

        private void AddRemovePersonsSeen(Checklist checklist, List<PersonsSeenViewModel> personsSeen)
        {

            var checklistPersonsSeen = new List<ChecklistPersonSeen>();
            //add to checklist
            personsSeen.ForEach(x =>
            {
                ChecklistPersonSeen checklistPersonSeen = null;

                if (x.EmployeeId.HasValue && x.EmployeeId != Guid.Empty)
                {
                    var employee = _employeeRespository.GetById(x.EmployeeId.Value);
                    checklistPersonSeen = ChecklistPersonSeen.Create(employee);
                    checklistPersonSeen.EmailAddress = x.EmailAddress;
                }
                else
                {
                    checklistPersonSeen = ChecklistPersonSeen.Create(x.Id, x.FullName, x.EmailAddress);
                }

                checklist.AddPersonSeen(checklistPersonSeen);
                checklistPersonsSeen.Add(checklistPersonSeen);
            });

            checklist.RemovePersonsSeenNotInList(checklistPersonsSeen);

        }

        private void AddRemoveOtherEmails(Checklist checklist, List<OtherEmailsViewModel> otherEmailsViewModel)
        {
            var checklistOtherEmailList = new List<ChecklistOtherEmail>();

            //add to checklist
            otherEmailsViewModel.ForEach(x =>
            {
                ChecklistOtherEmail checklistOtherEmail = null;

                checklistOtherEmail = ChecklistOtherEmail.Create(x.Id, x.EmailAddress, x.Name);

                checklist.AddOtherEmailAddresses(checklistOtherEmail);
                checklistOtherEmailList.Add(checklistOtherEmail);
            });

            checklist.UpdateOtherEmailsList(checklistOtherEmailList);
        }

        /// <summary>
        /// Returns a list of checklist for a given clientId
        /// </summary>
        /// <param name="clientId">integer</param>
        /// <returns></returns>
        [HttpGet]
        public List<ChecklistIndexViewModel> GetByClientId(int clientId)
        {
            var clientSites = _clientDetailsService.GetSites(clientId);
            var checklists = _checklistRepository.GetByClientId(clientId);
            return checklists.Select(x =>
            {
                var visitSite = clientSites.Any(site => site.Id == x.SiteId)
                    ? clientSites.First(site => site.Id == x.SiteId)
                    : null;

                return new ChecklistIndexViewModel()
                {
                    Id = x.Id,
                    Title = "Title",
                    VisitDate = x.VisitDate,
                    VisitBy = x.VisitBy,
                    CreatedOn = x.CreatedOn,
                    Site = visitSite != null
                        ? new SiteViewModel()
                        {
                            Address1 = visitSite.Address1,
                            Postcode = visitSite.Postcode,
                            SiteName = visitSite.SiteName
                        }
                        : null
                    //,ImmediateRiskNotifications = ImmediateRiskNotificationViewModelMapper.Map(x.ImmediateRiskNotifications)
                };
            }).ToList();

        }

        /// <summary>
        /// optimised version of query checklist. Requires testing ALP
        /// </summary>
        /// <param name="clientAccountNumber"></param>
        /// <param name="checklistCreatedBy"></param>
        /// <param name="visitDate"></param>
        /// <param name="status"></param>
        /// <param name="includeDeleted"></param>
        /// <param name="excludeSubmitted"> </param>
        /// <returns></returns>
        [HttpGet]
        public List<ChecklistIndexViewModel> Query(string clientAccountNumber, string checklistCreatedBy,
            string visitDate, string status, bool includeDeleted,
            bool excludeSubmitted, string statusFromDate,
            string statusToDate)
        {
            try
            {
                DateTime validVisitDate;
                DateTime? nullableValidVisitDate = null;
                if (!string.IsNullOrEmpty(visitDate) && DateTime.TryParse(visitDate, out validVisitDate))
                {
                    nullableValidVisitDate = validVisitDate;
                }

                DateTime validFromDate;
                DateTime? nullablevalidFromDate = null;
                if (!string.IsNullOrEmpty(statusFromDate) && DateTime.TryParse(statusFromDate, out validFromDate))
                {
                    nullablevalidFromDate = validFromDate;
                }

                DateTime validToDate;
                DateTime? nullablevalidToDate = null;
                if (!string.IsNullOrEmpty(statusToDate) && DateTime.TryParse(statusToDate, out validToDate))
                {
                    nullablevalidToDate = validToDate;
                }

                int? clientDetailId = null;
                if (!string.IsNullOrEmpty(clientAccountNumber))
                {
                    //if client not found then return empty list
                    var clientDetail = _clientDetailsService.GetByClientAccountNumber(clientAccountNumber);

                    if (clientDetail == null || clientDetail.Id == -1)
                    {
                        return new List<ChecklistIndexViewModel>();
                    }

                    clientDetailId = (int?) clientDetail.Id;
                }


                QaAdvisor qaAdvisorToSearchFor = null;
                if (checklistCreatedBy != null)
                {
                    qaAdvisorToSearchFor = _qaAdvisorRepository.GetByFullname(checklistCreatedBy);
                }


                BuildQuery(checklistCreatedBy, status, includeDeleted, excludeSubmitted, nullablevalidFromDate,
                    nullablevalidToDate, nullableValidVisitDate, clientDetailId, checklistCreatedBy, qaAdvisorToSearchFor);

                var checklists = _getChecklistsQuery.Execute();

                if (checklists != null)
                {
                    //store the site details and customer details retrieved from the Client Details Service so that we don't have to make multiple requests for the same ids
                    var visitSites = new List<SiteAddressResponse>();
                    var clientDetails = new List<CompanyDetails>();

                    var checklistIndexViewModelList = checklists.Select(x =>
                    {
                        var can = GetClientAccountNumber(clientDetails, x.ClientId);
                        var visitSite = GetVisitSiteAddress(visitSites, x.ClientId, x.SiteId);


                        var checklistViewModel = new ChecklistIndexViewModel()
                        {
                            Id = x.Id,
                            Title = "Title",
                            VisitDate = x.VisitDate.ToUniversalTime(),
                            VisitBy = x.VisitBy,
                            CreatedOn = x.CreatedOn.ToUniversalTime(),
                            CreatedBy = x.CreatedBy,
                            Site = new SiteViewModel() {Id = x.SiteId.HasValue ? x.SiteId.Value : -1},
                            Status = x.Deleted ? "Deleted" : x.Status,
                            CAN = can,
                            Deleted = x.Deleted,
                            HasQaComments = x.HasQaComments,
                            HasUnresolvedQaComments = !x.HasResolvedQaComments,
                            QaAdvisor = x.QaAdvisorId.HasValue
                                ? new QaAdvisorViewModel()
                                {
                                    Id = x.QaAdvisorId.Value,
                                    Initials = "" //x.QaAdvisorInitials,
                                }
                                : null,
                            ClientName = "",
                            ExecutiveSummaryDocumentLibraryId = x.ExecutiveSummaryDocumentLibraryId,
                            CompletedOn = x.CompletedDate.ToUniversalTime(),
                            SubmittedOn = x.SubmittedDate.ToUniversalTime(),
                            UpdatedOn = x.UpdatedOn.ToUniversalTime(),
                            QaAdvisorAssignedOn = x.QaAdvisorAssignedOn.ToUniversalTime(),
                            ExecutiveSummaryUpdateRequired = x.ExecutiveSummaryUpdateRequired,
                            ExecutiveSummaryQACommentsResolved = x.ExecutiveSummaryQACommentsResolved,
                            TemplateName = x.TemplateName,
                            QACommentStatus = x.QACommentStatus()

                        };

                        checklistViewModel.Site.Id = visitSite != null ? (int) visitSite.Id : -1;
                        checklistViewModel.Site.Postcode = visitSite != null ? visitSite.Postcode : "";
                        checklistViewModel.Site.SiteName = visitSite != null ? visitSite.SiteName : "";
                        checklistViewModel.Site.Address1 = visitSite != null ? visitSite.Address1 : "";
                        checklistViewModel.Site.Address2 = visitSite != null ? visitSite.Address2 : "";
                        checklistViewModel.Site.Address3 = visitSite != null ? visitSite.Address3 : "";
                        checklistViewModel.Site.Address4 = visitSite != null ? visitSite.Address4 : "";

                        checklistViewModel.Favourite = checklistViewModel.Deleted == false ? GetFavouriteChecklist(x.Id) : null;

                        return checklistViewModel;
                    }).ToList();

                    return checklistIndexViewModelList;
                }

                return new List<ChecklistIndexViewModel>();
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }
        }

        private void BuildQuery(string checklistCreatedBy, string status, bool includeDeleted, bool excludeSubmitted,
            DateTime? statusFromDate, DateTime? statusToDate, DateTime? nullableValidVisitDate,
            int? clientDetailId, string consultantToSearchFor, QaAdvisor qaAdvisorToSearchFor)
        {
            var query = _getChecklistsQuery
                .WithClientId(clientDetailId.HasValue ? clientDetailId.Value : default(int))
                .WithConsultantName(checklistCreatedBy)
                .WithStatus(status)
                .WithStatusDateBetween(statusFromDate, statusToDate);

            if (nullableValidVisitDate.HasValue)
            {
                query.WithVisitDate(nullableValidVisitDate.Value);
            }

            if (includeDeleted)
            {
                query.WithDeletedOnly();
            }

            if (excludeSubmitted)
            {
                query.ExcludeSubmitted();
            }

            if (!String.IsNullOrEmpty(consultantToSearchFor ))
            {
                query.WithConsultantName(consultantToSearchFor);
            }

            if (qaAdvisorToSearchFor != null)
            {
                query.WithQaAdvisor(qaAdvisorToSearchFor.Id);
            }
        }

        private SiteAddressResponse GetVisitSiteAddress(List<SiteAddressResponse> visitSites, int? clientId, int? siteId)
        {
            SiteAddressResponse visitSite = null;
            if (clientId.HasValue && clientId.Value != -1 && siteId.HasValue && siteId.Value != -1)
            {
                if (!visitSites.Any(sites => sites.Id == siteId))
                {
                    visitSite = _clientDetailsService.GetSite(clientId.Value, siteId.Value);
                    visitSites.Add(visitSite);
                }

                visitSite = visitSites.FirstOrDefault(sites => sites.Id == siteId.Value);
            }
            return visitSite;
        }

        private string GetClientAccountNumber(List<CompanyDetails> clientDetails, int? clientId)
        {

            string can = null;
            if (clientId.HasValue && clientId.Value != -1)
            {
                if (!clientDetails.Any(clients => clients.Id == clientId.Value))
                {
                    clientDetails.Add(_clientDetailsService.Get(clientId.Value));
                }

                var cachedClientDetail = clientDetails.FirstOrDefault(clients => clients.Id == clientId.Value);
                if (cachedClientDetail != null)
                {
                    can = cachedClientDetail.CAN;
                }
            }
            return can;
        }

        /// <summary>
        /// we need this for CORS. if this is removed clients will receive a 405 method not allowed http error
        /// </summary>
        /// <returns></returns>
        [HttpOptions]
        public HttpResponseMessage Options()
        {
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        /// <summary>
        /// Deletes a question from a checklist with the specified Id.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage DeleteChecklistQuestion(Guid checklistQuestionId)
        {
            var checklistQuestion = _checklistQuestionRepository.GetById(checklistQuestionId);
            checklistQuestion.MarkForDelete(null);
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        /// <summary>
        /// Returns the impression types from the database
        /// </summary>
        /// <returns>Returns Ienumerable list of impression Types</returns>
        public IEnumerable<ImpressionTypeViewModel> GetImpressionTypes()
        {
            return _impressionRespository.GetAll().Select(i =>
                new ImpressionTypeViewModel
                {
                    Id = i.Id,
                    Title = i.Title,
                    Comments = i.Comments
                }
                ).ToList();
        }

        /// <summary>
        /// Returns a list of users who have created a checklist
        /// </summary>
        /// <returns></returns>
        public IList<string> GetDistinctCreatedBy()
        {
            try
            {
                return _checklistRepository.GetDistinctCreatedBy();
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }
        }

        public DateTime? GetLastModifiedOn(Guid id)
        {
            try
            {
                var checklist = _checklistRepository.GetById(id);

                if (checklist == null)
                {
                    return null;
                }
                else
                {
                    if (checklist.LastModifiedOn.HasValue)
                    {
                        return checklist.LastModifiedOn.Value;
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }
        }


        [HttpPost]
        public HttpResponseMessage AssignChecklistToQaAdvisor(Guid id, QaAdvisorViewModel model)
        {
            try
            {
                var checklist = _checklistRepository.GetById(id);

                if (checklist == null)
                {
                    throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound,
                        "Checklist: " + id + "Not Found."));
                }

                var qaAdvisor = _qaAdvisorRepository.GetById(model.Id);

                _qualityControlService.AssignChecklistToQaAdvisor(checklist, qaAdvisor);

                _checklistRepository.SaveOrUpdate(checklist);
                _checklistRepository.Flush();
            }

            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [HttpPost]
        public HttpResponseMessage SendUpdateRequiredEmailNotification(Guid id)
        {
            try
            {
                var checklist = _checklistRepository.GetById(id);

                if (checklist == null)
                {
                    throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound,
                        "Checklist: " + id + "Not Found."));
                }

                var sendUpdateRequiredEmail = new SendUpdateRequiredEmail()
                {
                    ChecklistId = checklist.Id,
                };

                if (checklist.ClientId.HasValue)
                {
                    var clientDetail = _clientDetailsService.Get(checklist.ClientId.Value);

                    var site = checklist.SiteId.HasValue
                        ? _clientDetailsService.GetSite(checklist.ClientId.Value, checklist.SiteId.Value)
                        : null;

                    var postcode = site != null ? site.Postcode : "";

                    sendUpdateRequiredEmail.Can = clientDetail.CAN;
                    sendUpdateRequiredEmail.Postcode = postcode;
                }
                else
                {
                    sendUpdateRequiredEmail.Can = "Not specified";
                    sendUpdateRequiredEmail.Postcode = "Not specified";
                }

                checklist.UpdatesRequiredLog.Add(new ChecklistUpdatesRequired()
                {
                    Checklist = checklist,
                    QaAdvisor = checklist.QaAdvisor,
                    UpdatesRequiredOn = DateTime.Now
                });

                _checklistRepository.SaveOrUpdate(checklist);
                _checklistRepository.Flush();

                _bus.Send(sendUpdateRequiredEmail);
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [HttpPost]
        public HttpResponseMessage SendChecklistCompleteEmailNotification(Guid id)
        {
            try
            {
                var checklist = _checklistRepository.GetById(id);

                if (checklist == null)
                {
                    throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound,
                        "Checklist: " + id + "Not Found."));
                }

                var sendChecklistCompleteEmail = new SendSafeCheckChecklistCompletedEmail()
                {
                    ChecklistId = checklist.Id
                };

                if (checklist.ClientId.HasValue)
                {
                    var clientDetail = _clientDetailsService.Get(checklist.ClientId.Value);

                    var site = checklist.SiteId.HasValue
                        ? _clientDetailsService.GetSite(checklist.ClientId.Value, checklist.SiteId.Value)
                        : null;

                    var postcode = site != null ? site.Postcode : "";

                    sendChecklistCompleteEmail.Can = clientDetail.CAN;
                    sendChecklistCompleteEmail.Postcode = postcode;
                }
                else
                {
                    sendChecklistCompleteEmail.Can = "Not specified";
                    sendChecklistCompleteEmail.Postcode = "Not specified";
                }

                _bus.Send(sendChecklistCompleteEmail);
            }

            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [HttpGet]
        public HttpResponse GetExecutiveSummaryForChecklist(Guid checklistId)
        {
            var checklist = _checklistRepository.GetById(checklistId);

            ClientDocumentDto clientDocumentDto = null;
            if (checklist != null && checklist.ActionPlan != null
                && checklist.ActionPlan.ExecutiveSummaryDocumentLibraryId.HasValue
                && checklist.ActionPlan.ExecutiveSummaryDocumentLibraryId.Value != 0)
            {
                using (var securityService = new SecurityServiceClient())
                using (new OperationContextScope(securityService.InnerChannel))
                {
                    OperationContext.Current.OutgoingMessageHeaders.Add(MessageHeader.CreateHeader("Username",
                        "Peninsula.Common",
                        "SafeCheckUser"));
                    securityService.EnsureUserExists(null);
                }

                using (var clientDocumentService = new ClientDocumentServiceClient())
                {
                    using (new OperationContextScope(clientDocumentService.InnerChannel))
                    {
                        OperationContext.Current.OutgoingMessageHeaders.Add(MessageHeader.CreateHeader("Username",
                            "Peninsula.Common",
                            "SafeCheckUser"));
                        clientDocumentDto =
                            clientDocumentService.GetByIdWithContent(
                                checklist.ActionPlan.ExecutiveSummaryDocumentLibraryId.Value);
                    }
                }
            }

            // get the object representing the HTTP response to browser
            HttpResponse httpResponse = System.Web.HttpContext.Current.Response;
            if (clientDocumentDto == null)
            {
                httpResponse.Status = "204 No Content";
                httpResponse.StatusCode = 204;

                httpResponse.ContentType = "text/html";
                httpResponse.Write("Error downloading file - Please contact with us");

                httpResponse.End();

            }
            else
            {
                httpResponse.AddHeader("Content-Type", "application/pdf");
                httpResponse.AddHeader("Content-Disposition", String.Format("attachment; filename={1}; size={0}",
                    clientDocumentDto.FileBytes.Length.ToString(), clientDocumentDto.OriginalFilename));

                // write the PDF document bytes as attachment to HTTP response 
                httpResponse.BinaryWrite(clientDocumentDto.FileBytes);

                // Note: it is important to end the response, otherwise the ASP.NET
                // web page will render its content to PDF document stream
                httpResponse.End();
            }

            return httpResponse;
        }

        /// <summary>
        /// Copies the checklist questions to a new draft checklist to the site(s) specified
        /// </summary>
        /// <param name="checklistId">The id of the checklist to copy</param>
        /// <param name="siteIds">The peninsula site ids to copy to</param>
        /// <returns></returns>
        [HttpPost]
        public List<CopyChecklistResponseViewModel> CopyToSiteWithoutResponses(Guid checklistId, int clientId, bool isClone, int[] siteIds)
        {
            try
            {
                var result = new List<CopyChecklistResponseViewModel>();
                var copiedByName = _userIdentityFactory.GetUserIdentity(User).Name;

                foreach (var siteId in siteIds)
                {
                    var copyResult = new CopyChecklistResponseViewModel();
                    copyResult.SiteId = siteId;
                    copyResult.ChecklistId = _checklistService.CopyToSiteWithoutResponses(checklistId, siteId, clientId, copiedByName, isClone);
                    result.Add(copyResult);
                }

                return result;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }
        }

        [HttpPost]
        public List<CopyChecklistResponseViewModel> CopyToSiteWithResponses(Guid checklistId, int clientId, bool isClone, int[] siteIds)
        {
            try
            {
                var result = new List<CopyChecklistResponseViewModel>();
                var copiedByName = _userIdentityFactory.GetUserIdentity(User).Name;

                foreach (var siteId in siteIds)
                {
                    var copyResult = new CopyChecklistResponseViewModel();
                    copyResult.SiteId = siteId;
                    copyResult.ChecklistId = _checklistService.CopyToSiteWithResponses(checklistId, siteId, clientId, copiedByName, isClone);
                    result.Add(copyResult);
                }

                return result;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof(ChecklistController)).Error(ex);
                throw;
            }
        }

        [HttpPost]
        public void CloneChecklist(Guid checklistId, int clientId, int[] siteIds)
        {
            try
            {
                var checklist = _checklistRepository.GetById(checklistId);

                if (checklist == null)
                {
                    throw new Exception("Checklist not found");
                }

                var user = _userForAuditingRepository.GetSystemUser();

                var copiedByName = new UserIdentity(User).Name;
                
                foreach (int siteId in siteIds)
                {                
                    var newChecklist = checklist.CopyToSiteWithoutResponses(siteId, clientId, user, copiedByName, true);
                    
                    _checklistRepository.Save(newChecklist);
                    _checklistRepository.Flush();
                }
            
            }
            catch (HttpResponseException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof (ChecklistController)).Error(ex);
                throw;
            }
        }

       
        private FavouriteChecklistViewModel GetFavouriteChecklist(Guid checklistId)
        {
            try
            {
                var loggedInUser = new UserIdentity(User).Name;

                var favouriteChecklist = _qualityControlService.GetFavouriteChecklist(checklistId, loggedInUser, false);
                
                if (favouriteChecklist != null)
                {
                    return new FavouriteChecklistViewModel()
                    {
                        Id = favouriteChecklist.Id, 
                        ChecklistId = favouriteChecklist.Checklist.Id, 
                        User = favouriteChecklist.MarkedByUser,
                        Title = favouriteChecklist.Title
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof(ChecklistController)).Error(ex);
                throw;
            }
        }

        [HttpPost]
        public FavouriteChecklistViewModel MarkChecklistAsFavourite(Guid checklistId, FavouriteChecklistRequestViewModel request)
        {
            try
            {
                var checklist = _checklistRepository.GetById(checklistId);

                if (checklist == null)
                {
                    throw new Exception("Checklist not found");
                }

                var userForAuditing = _userForAuditingRepository.GetSystemUser();

                var loggedInUser = new UserIdentity(User).Name;
                
                var favouriteChecklist =_qualityControlService.GetFavouriteChecklist(checklist.Id, loggedInUser, true);

                if (favouriteChecklist == null)
                {
                    favouriteChecklist = FavouriteChecklist.Create(request.Title, checklist, loggedInUser);
                    _qualityControlService.MarkChecklistAsFavourite(favouriteChecklist);
                }
                else
                {
                    favouriteChecklist.Title = request.Title;
                    _qualityControlService.MarkChecklistAsFavourite(favouriteChecklist, userForAuditing);
                }

                return GetFavouriteChecklist(favouriteChecklist.Checklist.Id);
            }
            catch (HttpResponseException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof(ChecklistController)).Error(ex);
                throw;
            }
        }

        [HttpPost]
        public HttpResponseMessage UnMarkChecklistAsFavourite(Guid checklistId)
        {
            try
            {
                var checklist = _checklistRepository.GetById(checklistId);

                if (checklist == null)
                {
                    throw new Exception("Checklist not found");
                }

                var loggedInUser = new UserIdentity(User).Name;
                var userForAuditing = _userForAuditingRepository.GetSystemUser();

                _qualityControlService.UnMarkChecklistAsFavourite(checklist, loggedInUser, userForAuditing);

            }
            catch (HttpResponseException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof(ChecklistController)).Error(ex);
                throw;
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [HttpGet]
        public IList<FavouriteChecklistSearchResultViewModel> SearchFavourites()
        {
            var favouriteChecklistSearchResultViewModelList = new List<FavouriteChecklistSearchResultViewModel>();

            var loggedInUser = new UserIdentity(User).Name;
            var favouriteChecklists  = _qualityControlService.SearchFavouritesChecklists(loggedInUser);

            foreach (var favChecklist in favouriteChecklists)
            {
                var can = GetClientAccountNumber(new List<CompanyDetails>(), favChecklist.Checklist.ClientId);
                var visitSite = GetVisitSiteAddress(new List<SiteAddressResponse>(), favChecklist.Checklist.ClientId, favChecklist.Checklist.SiteId);

                var favouriteChecklistSearchResultViewModel = new FavouriteChecklistSearchResultViewModel()
                {
                    Id=favChecklist.Id,
                    ChecklistId = favChecklist.Checklist.Id,  
                    Title = favChecklist.Title,
                    MarkedByUser = favChecklist.MarkedByUser,
                    CAN = can,
                    TemplateName = favChecklist.Checklist.ChecklistTemplate != null ? favChecklist.Checklist.ChecklistTemplate.Name : null,
                    //Status  = favChecklist.Checklist.Deleted ? "Deleted" : favChecklist.Checklist.Status,
                    Status = favChecklist.Checklist.Status,
                    Site = new SiteViewModel() { Id = favChecklist.Checklist.SiteId.HasValue ? favChecklist.Checklist.SiteId.Value : -1 },
                    StatusDate = GetStatusDate(favChecklist.Checklist)
                };
                
                favouriteChecklistSearchResultViewModel.Site.Id = visitSite != null ? (int)visitSite.Id : -1;
                favouriteChecklistSearchResultViewModel.Site.Postcode = visitSite != null ? visitSite.Postcode : "";
                favouriteChecklistSearchResultViewModel.Site.SiteName = visitSite != null ? visitSite.SiteName : "";
                favouriteChecklistSearchResultViewModel.Site.Address1 = visitSite != null ? visitSite.Address1 : "";
                favouriteChecklistSearchResultViewModel.Site.Address2 = visitSite != null ? visitSite.Address2 : "";
                favouriteChecklistSearchResultViewModel.Site.Address3 = visitSite != null ? visitSite.Address3 : "";
                favouriteChecklistSearchResultViewModel.Site.Address4 = visitSite != null ? visitSite.Address4 : "";
                favouriteChecklistSearchResultViewModelList.Add(favouriteChecklistSearchResultViewModel);
            }

            return favouriteChecklistSearchResultViewModelList;
        }



        [HttpPost]
        public HttpResponseMessage RestoreDeletedChecklist(Guid checklistId)
        {
            try
            {
                var checklist = _checklistRepository.GetById(checklistId);

                if (checklist == null)
                {
                    throw new Exception("Checklist not found");
                }

                var userForAuditing = _userForAuditingRepository.GetSystemUser();             

                checklist.Deleted = false;
                checklist.DeletedBy = null;
                checklist.DeletedOn = null;

                checklist.LastModifiedBy = userForAuditing;
                checklist.LastModifiedOn = DateTime.Now;

                _checklistRepository.SaveOrUpdate(checklist);
                _checklistRepository.Flush();
                              
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (HttpResponseException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof(ChecklistController)).Error(ex);
                throw;
            }
        }

        [HttpPost]
        public bool RevertChecklist(Guid checklistId)
        {
            try
            {
                var loggedInUser = new UserIdentity(User).Name;
                var userForAuditing = _userForAuditingRepository.GetSystemUser();

                if (!_checklistService.CanRevertChecklist(checklistId))
                {
                    return false;
                }

                _checklistService.RevertChecklist(checklistId, userForAuditing, loggedInUser);
                
                return true;
                
            }
            catch (HttpResponseException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _businessSafeSessionManager.Rollback();
                LogManager.GetLogger(typeof(ChecklistController)).Error(ex);
                throw;
            }
        }
        

        private DateTime? GetStatusDate(Checklist checklist)
        {
            DateTime? statusDate = null;
            switch (checklist.Status)
                {
                    case "Completed":
                        statusDate = checklist.ChecklistCompletedOn;
                        break;
                    case "Assigned":
                        statusDate = checklist.QaAdvisorAssignedOn;
                        break;
                    case "Submitted":
                        statusDate = checklist.ChecklistSubmittedOn;
                        break;
                   default:
                        statusDate = checklist.CreatedOn;
                        break;
               }
            return statusDate;
        }
    }
}
