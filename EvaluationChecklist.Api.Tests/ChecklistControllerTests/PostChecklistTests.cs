﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Web.Http;
using System.Web.Http.Hosting;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.InfrastructureContracts.Logging;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using BusinessSafe.Messages.Emails.Commands;
using EvaluationChecklist.ClientDetails;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NServiceBus;
using NUnit.Framework;
using Peninsula.Online.Data.NHibernate.ApplicationServices;
using Action = BusinessSafe.Domain.Entities.Action;
using Checklist = BusinessSafe.Domain.Entities.SafeCheck.Checklist;
using CompanyDetails = EvaluationChecklist.ClientDetails.Models.CompanyDetails;
using IQuestionRepository = BusinessSafe.Domain.RepositoryContracts.SafeCheck.IQuestionRepository;
using Question = BusinessSafe.Domain.Entities.SafeCheck.Question;

namespace EvaluationChecklist.Api.Tests.ChecklistControllerTests
{
    [TestFixture]
    public class PostChecklistTests
    {
        private class ChecklistForTest : Checklist
        {
            public IList<ImmediateRiskNotification> PrivateIRNList
            {
                get { return _immediateRiskNotifications.ToList(); }
            }
        }

        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<ICheckListRepository> _checklistRepository;
        private Mock<IQuestionRepository> _questionRepository;
        private Mock<IQuestionResponseRepository> _questionResponseRepository;
        private Mock<IChecklistQuestionRepository> _checklistQuestionRepository;
        private Mock<IEmployeeRepository> _employeeRespository;
        private Mock<IImpressionTypeRepository> _impressionTypeRespository;
        private Mock<ICategoryRepository> _categoryRepository;
        private Mock<IUserForAuditingRepository> _userForAuditing;
        private Mock<ISiteRepository> _siteRepository;
        private Mock<IPeninsulaLog> _log;
        private List<Category> _categories;
        private List<ImpressionType> _impressionTypes;
        private UserForAuditing _user;
        private Mock<ITimescaleRepository> _timescaleRepositories;
        private Mock<IChecklistPdfCreator> _checklistPdfCreator;
        private Mock<IClientDocumentationChecklistPdfWriter> _clientDocumentationChecklistPdfWriter;
        private Mock<IQaAdvisorRepository> _qaAdvisorRepository;
        private long _peninsulaSiteId = 324124L;
        private Mock<IBus> _bus;
        private Mock<IQualityControlService> _qualityControlService;
        private Mock<IClientDetailsService> _clientDetailsService;
      
        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();
            _checklistRepository = new Mock<ICheckListRepository>();
            _questionRepository = new Mock<IQuestionRepository>();
            _questionResponseRepository = new Mock<IQuestionResponseRepository>();
            _checklistQuestionRepository = new Mock<IChecklistQuestionRepository>();
            _employeeRespository = new Mock<IEmployeeRepository>();
            _impressionTypeRespository = new Mock<IImpressionTypeRepository>();
            _categoryRepository = new Mock<ICategoryRepository>();
            _userForAuditing = new Mock<IUserForAuditingRepository>();
            _siteRepository = new Mock<ISiteRepository>();
            _log = new Mock<IPeninsulaLog>();
            _timescaleRepositories = new Mock<ITimescaleRepository>();
            _checklistPdfCreator = new Mock<IChecklistPdfCreator>();
            _clientDocumentationChecklistPdfWriter = new Mock<IClientDocumentationChecklistPdfWriter>();
            _qaAdvisorRepository = new Mock<IQaAdvisorRepository>();
            _bus = new Mock<IBus>();
            _qualityControlService = new Mock<IQualityControlService>();
            _clientDetailsService = new Mock<IClientDetailsService>();
           
            _dependencyFactory
                .Setup(x => x.GetInstance<ICheckListRepository>())
                .Returns(_checklistRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQuestionRepository>())
                .Returns(_questionRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQuestionResponseRepository>())
                .Returns(_questionResponseRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IChecklistQuestionRepository>())
                .Returns(_checklistQuestionRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IImpressionTypeRepository>())
                .Returns(_impressionTypeRespository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<ICategoryRepository>())
                .Returns(_categoryRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IUserForAuditingRepository>())
                .Returns(_userForAuditing.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<ISiteRepository>())
                .Returns(_siteRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IPeninsulaLog>())
                .Returns(_log.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IEmployeeRepository>())
                .Returns(_employeeRespository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<ITimescaleRepository>())
                .Returns(_timescaleRepositories.Object);
            
            _dependencyFactory
                .Setup(x => x.GetInstance<IChecklistPdfCreator>())
                .Returns(_checklistPdfCreator.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IClientDocumentationChecklistPdfWriter>())
                .Returns(_clientDocumentationChecklistPdfWriter.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQaAdvisorRepository>())
                .Returns(_qaAdvisorRepository.Object);

            _dependencyFactory
               .Setup(x => x.GetInstance<IBus>())
               .Returns(_bus.Object);

            _dependencyFactory
             .Setup(x => x.GetInstance<IQualityControlService>())
             .Returns(_qualityControlService.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IClientDetailsService>())
                .Returns(_clientDetailsService.Object);
            
            
            _user = new UserForAuditing() {Id = Guid.NewGuid(), CompanyId = 1};

            _userForAuditing.Setup(x => x.GetSystemUser()).Returns(_user);

            _categories = new List<Category>();
            _categories.Add(new Category());
            _categories[0].Id = Guid.NewGuid();
            _categories[0].Title = "Category 1";
            _categories.Add(new Category());
            _categories[1].Id = Guid.NewGuid();
            _categories[1].Title = "Category 2";


            foreach (var category in _categories)
            {
                _categoryRepository
                    .Setup(x => x.GetById(category.Id))
                    .Returns(category);
            }

            _impressionTypes = new List<ImpressionType>();
            _impressionTypes.Add(new ImpressionType());
            _impressionTypes[0].Id = Guid.NewGuid();
            _impressionTypes[0].Title = "Impression Type 1";
            _impressionTypes[0].Comments = "ImpressionType Comments 1";
            _impressionTypes.Add(new ImpressionType());
            _impressionTypes[1].Id = Guid.NewGuid();
            _impressionTypes[1].Title = "Impression Type 2";
            _impressionTypes[1].Comments = "ImpressionType Comments 2";

            foreach (var impressionType in _impressionTypes)
            {
                _impressionTypeRespository
                    .Setup(x => x.GetById(impressionType.Id))
                    .Returns(impressionType);
            }

            _siteRepository
                .Setup(x => x.GetByPeninsulaSiteId(_peninsulaSiteId))
                .Returns(new Site());

            _employeeRespository
                .Setup((x => x.GetById(It.IsAny<Guid>())))
                .Returns<Guid>((id) => new Employee() {Id= id});
			 _clientDetailsService
                .Setup(x => x.Get(It.IsAny<int>()))
                .Returns( new CompanyDetails(){CAN = "TST123"});
            
        }

        [Test]
        public void Given_basic_details_are_included_and_checklist_does_not_exist_When_PostChecklist_called_Then_details_are_recorded()
        {
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.CoveringLetterContent = "covering letter content 1";
            viewModel.Status = "Test status 1";
            viewModel.QAComments = "qa comments tests";
            viewModel.UpdatesRequired = false;

            _checklistRepository
                .Setup(x => x.GetById(viewModel.Id))
                .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(viewModel.Id, viewModel);
            Assert.That(savedChecklist, Is.Not.Null);
            Assert.That(savedChecklist.Id, Is.EqualTo(viewModel.Id));
            Assert.That(savedChecklist.ClientId, Is.EqualTo(viewModel.ClientId));
            Assert.That(savedChecklist.CoveringLetterContent, Is.EqualTo(viewModel.CoveringLetterContent));
            Assert.That(savedChecklist.Status, Is.EqualTo(viewModel.Status));
            Assert.That(savedChecklist.QAComments, Is.EqualTo(viewModel.QAComments));
            Assert.That(savedChecklist.UpdatesRequired, Is.EqualTo(viewModel.UpdatesRequired)); 
        }

        [Test]
        public void Given_a_checklist_does_not_exist_and_submit_is_true_When_PostChecklist_is_called_Then_action_plan_is_created_with_correct_title_and_site()
        {
             //Get view model
             var questions = GetListOfQuestions();
             var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
             checklistViewModel.SiteId = 234234;
             checklistViewModel.ClientId = 11;
             checklistViewModel.CoveringLetterContent = "Letter content";
             checklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();
             checklistViewModel.Questions = new List<QuestionAnswerViewModel>();
             checklistViewModel.CreatedOn = DateTime.Now;
             checklistViewModel.CreatedBy = "user";
             checklistViewModel.SiteId = 1;

             checklistViewModel.Site = new SiteViewModel
             {
                 Id = checklistViewModel.SiteId.Value,
                 Address1 = "1 Green Lane",
                 Postcode = "M1 1AA"
             };

             checklistViewModel.SiteVisit = new SiteVisitViewModel
             {
                 VisitDate = new DateTime(2000, 2, 14)
             };

             checklistViewModel.Submit = true;

             var site = new Site { Id = 21L, SiteId = checklistViewModel.SiteId };
             _siteRepository
                 .Setup(x => x.GetByPeninsulaSiteId((long)checklistViewModel.SiteId))
                 .Returns(site);

             _checklistRepository
                 .Setup(x => x.GetById(checklistViewModel.Id))
                 .Returns((Checklist)null);

             Checklist savedChecklist = null;
             _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                 .Callback(
                     delegate(Checklist x)
                     {
                         savedChecklist = x;
                     }
                 );

             var controller = GetTarget();
             controller.Request = new HttpRequestMessage();
             controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());
             var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
             Assert.That(savedChecklist.ActionPlan, Is.Not.Null);
             Assert.That(savedChecklist.ActionPlan.Title, Is.EqualTo("Visit Report - 1 Green Lane - M1 1AA - 14/02/2000"));
             Assert.That(savedChecklist.ActionPlan.Site, Is.EqualTo(site));
             Assert.That(savedChecklist.ChecklistCreatedOn, Is.EqualTo(checklistViewModel.CreatedOn));
             Assert.That(savedChecklist.ChecklistCreatedBy, Is.EqualTo(checklistViewModel.CreatedBy));
         }

        [Test]
        public void Given_a_checklist_already_exists_for_site_and_submit_is_true_When_PostChecklist_is_called_Then_previous_action_statuses_are_set_to_No_Longer_Required()
        {
        
            int clientId = 23456;

            int siteID = 1234;
            Site site = new Site { Id = 21L, SiteId = siteID };
            _siteRepository
                .Setup(x => x.GetByPeninsulaSiteId((long)siteID))
                .Returns(site);


            Checklist previousChecklist = new Checklist();
            previousChecklist.Id = Guid.NewGuid();
            previousChecklist.SiteId = siteID;
            previousChecklist.ClientId = clientId;
            previousChecklist.Status = "Submitted";

            var actionPlanId = 234;
            previousChecklist.ActionPlan = new ActionPlan();
            previousChecklist.ActionPlan.Id =actionPlanId;

            Action action = new Action() {Id = 1, ActionPlanId = actionPlanId};

            action.ActionTasks = new List<ActionTask>();

            action.ActionTasks.Add(new ActionTask() { Id = 123, TaskStatus = TaskStatus.Outstanding });
            action.ActionTasks.Add(new ActionTask() { Id = 123, TaskStatus = TaskStatus.Overdue });
            action.ActionTasks.Add(new ActionTask() { Id = 123, TaskStatus = TaskStatus.Completed }); 

            previousChecklist.ActionPlan.Actions = new List<Action>();
            previousChecklist.ActionPlan.Actions.Add(action);          
            
            List<Checklist> checklists = new List<Checklist>();
            checklists.Add(previousChecklist);

            _checklistRepository
                .Setup(x => x.GetByClientId( clientId))
                .Returns(checklists);
            
            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(previousChecklist))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );
            
            //Get view model
            var questions = GetListOfQuestions();
            var newChecklistViewModel = GetChecklistViewModelFromQuestions(questions);
            newChecklistViewModel.SiteId = siteID;
            newChecklistViewModel.ClientId = clientId;
            newChecklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();
            newChecklistViewModel.Questions = new List<QuestionAnswerViewModel>();
            newChecklistViewModel.CreatedOn = DateTime.Now;
            newChecklistViewModel.CreatedBy = "user";
         
            newChecklistViewModel.Submit = true;
            
            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(newChecklistViewModel.Id, newChecklistViewModel);

            Assert.That(savedChecklist.ActionPlan, Is.Not.Null);
            Assert.That(savedChecklist.ActionPlan.Actions[0], Is.Not.Null);
            
            Assert.AreEqual(3, savedChecklist.ActionPlan.Actions[0].ActionTasks.Count);
            Assert.AreEqual(TaskStatus.NoLongerRequired, savedChecklist.ActionPlan.Actions[0].ActionTasks[0].TaskStatus );
            Assert.AreEqual(TaskStatus.NoLongerRequired, savedChecklist.ActionPlan.Actions[0].ActionTasks[1].TaskStatus);
            Assert.AreEqual(TaskStatus.Completed, savedChecklist.ActionPlan.Actions[0].ActionTasks[2].TaskStatus);

            Assert.AreEqual(DerivedTaskStatusForDisplay.Completed, savedChecklist.ActionPlan.Actions[0].GetStatusFromTasks());        
        }
        
        [Test]
        public void Given_a_checklist_exists_for_a_different_company_site_and_submit_is_true_When_PostChecklist_is_called_Then_otherchecklist_is_not_archived()
         {
             int clientId = 23456;
           
        //------------------------------------------------
             int siteOneID = 1111;
             Site siteOne = new Site { Id = 21L, SiteId = siteOneID };
             _siteRepository
                 .Setup(x => x.GetByPeninsulaSiteId((long)siteOneID))
                 .Returns(siteOne);

             Checklist siteOneChecklist = new Checklist();
                  

             siteOneChecklist.Id = Guid.NewGuid();
             siteOneChecklist.SiteId = siteOneID;
             siteOneChecklist.ClientId = clientId;
             siteOneChecklist.Status = "Submitted";

             var actionPlanOneId = 234;
             siteOneChecklist.ActionPlan = new ActionPlan();
             siteOneChecklist.ActionPlan.Id = actionPlanOneId;

             Action action = new Action() { Id = 1, ActionPlanId = actionPlanOneId };

             action.ActionTasks = new List<ActionTask>();

             action.ActionTasks.Add(new ActionTask() { Id = 111, TaskStatus = TaskStatus.Outstanding });
             action.ActionTasks.Add(new ActionTask() { Id = 112, TaskStatus = TaskStatus.Overdue });
             action.ActionTasks.Add(new ActionTask() { Id = 113, TaskStatus = TaskStatus.Completed });

             siteOneChecklist.ActionPlan.Actions = new List<Action>();
             siteOneChecklist.ActionPlan.Actions.Add(action);

             //------------------------------------------------
             int siteTwoID = 2222;
             Site siteTwo = new Site { Id = 21L, SiteId = siteTwoID };
             _siteRepository
                 .Setup(x => x.GetByPeninsulaSiteId((long)siteTwoID))
                 .Returns(siteTwo);
             Checklist siteTwoChecklist = new Checklist();     


             siteTwoChecklist.Id = Guid.NewGuid();
             siteTwoChecklist.SiteId = siteTwoID;
             siteTwoChecklist.ClientId = clientId;
             siteTwoChecklist.Status = "Submitted";

             var actionPlanTwoId = 234;
             siteTwoChecklist.ActionPlan = new ActionPlan();
             siteTwoChecklist.ActionPlan.Id = actionPlanTwoId;

             Action actionTwo = new Action() { Id = 2, ActionPlanId = actionPlanTwoId };

             actionTwo.ActionTasks = new List<ActionTask>();

             actionTwo.ActionTasks.Add(new ActionTask() { Id = 221, TaskStatus = TaskStatus.Outstanding });
             actionTwo.ActionTasks.Add(new ActionTask() { Id = 222, TaskStatus = TaskStatus.Overdue });
             actionTwo.ActionTasks.Add(new ActionTask() { Id = 223, TaskStatus = TaskStatus.Completed });

             siteTwoChecklist.ActionPlan.Actions = new List<Action>();
             siteTwoChecklist.ActionPlan.Actions.Add(action);
         

             //------------------------------------------------
             List<Checklist> checklists = new List<Checklist>();
             checklists.Add(siteOneChecklist);
             checklists.Add(siteTwoChecklist);
             
             _checklistRepository
                 .Setup(x => x.GetByClientId(clientId))
                 .Returns(checklists);

             Checklist savedSiteOneChecklist = null;
             _checklistRepository.Setup(x => x.SaveOrUpdate(siteOneChecklist))
                 .Callback(
                     delegate(Checklist x)
                     {
                         savedSiteOneChecklist = x;
                     }
                 );

             Checklist savedSiteTwoChecklist = null;
             _checklistRepository.Setup(x => x.SaveOrUpdate(siteTwoChecklist))
                 .Callback(
                     delegate(Checklist x)
                     {
                         savedSiteTwoChecklist = x;
                     }
                 );           

             //Get view model
             var questions = GetListOfQuestions();
             var newChecklistViewModel = GetChecklistViewModelFromQuestions(questions);
             newChecklistViewModel.SiteId = siteTwoID;
             newChecklistViewModel.ClientId = clientId;
             newChecklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();
             newChecklistViewModel.Questions = new List<QuestionAnswerViewModel>();
             newChecklistViewModel.CreatedOn = DateTime.Now;
             newChecklistViewModel.CreatedBy = "user";

             newChecklistViewModel.Submit = true;

             var controller = GetTarget();
             controller.Request = new HttpRequestMessage();
             controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

             var response = controller.PostChecklist(newChecklistViewModel.Id, newChecklistViewModel);

             Assert.That(savedSiteTwoChecklist.ActionPlan, Is.Not.Null);
             Assert.That(savedSiteTwoChecklist.ActionPlan.Actions[0], Is.Not.Null);
             Assert.AreEqual(true, savedSiteTwoChecklist.ActionPlan.NoLongerRequired);             

             Assert.That(savedSiteOneChecklist, Is.Null);                                 
         }


        [Test]
        public void Given_a_checklist_exists_when_a_new_question_is_added_with_no_answer_Then_the_question_is_adde_to_the_checklist()
        {
            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            var questions = GetListOfQuestions();
            //checklist.UpdateQuestions(questions, new UserForAuditing());

            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });
            }
            checklist.Questions[0].CategoryNumber = 1;
            checklist.Questions[0].QuestionNumber = 1;
            checklist.Questions[1].CategoryNumber = 1;
            checklist.Questions[1].QuestionNumber = 2;
            checklist.Questions[2].CategoryNumber = 2;
            checklist.Questions[2].QuestionNumber = 1;


            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.Id = checklist.Id;
            checklistViewModel.SiteId = (int) _peninsulaSiteId;
            checklistViewModel.Questions[0].CategoryNumber = 1;
            checklistViewModel.Questions[0].QuestionNumber = 1;
            checklistViewModel.Questions[1].CategoryNumber = 1;
            checklistViewModel.Questions[1].QuestionNumber = 2;
            checklistViewModel.Questions[2].CategoryNumber = 2;
            checklistViewModel.Questions[2].QuestionNumber = 1;

            //Add new questions to API.
            var newQuestionAnswer = GetQuestionAnswerViewModel();
            checklistViewModel.Questions.Add(newQuestionAnswer);

            _checklistRepository
                .Setup(x => x.GetById(checklist.Id))
                .Returns(checklist);

            foreach (var question in questions)
            {
                _questionRepository
                    .Setup(x => x.GetById(question.Id))
                    .Returns(()=>question);
            }

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklist.Id, checklistViewModel);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(checklist.Questions.Count, Is.EqualTo(4));
            Assert.That(checklist.Questions[0].Question.Id, Is.EqualTo(questions[0].Id));
            Assert.That(checklist.Questions[1].Question.Id, Is.EqualTo(questions[1].Id));
            Assert.That(checklist.Questions[2].Question.Id, Is.EqualTo(questions[2].Id));
            Assert.That(checklist.Questions[3].Question.Id, Is.EqualTo(newQuestionAnswer.Question.Id));
            Assert.That(checklist.Questions[3].Question.SpecificToClientId, Is.EqualTo(newQuestionAnswer.Question.SpecificToClientId));
        }

        [Test]
        public void Given_a_checklist_does_not_exist_when_a_question_is_added_then_category_number_or_question_number_are_added()
        {
            var questions = GetListOfQuestions();
            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);

            checklistViewModel.SiteId = 234234;
            checklistViewModel.ClientId = 11;
            checklistViewModel.CoveringLetterContent = "Letter content";
            checklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();;
            checklistViewModel.CreatedOn = DateTime.Now;
            checklistViewModel.CreatedBy = "user";
            checklistViewModel.SiteId = 1;

            checklistViewModel.Questions[0].CategoryNumber = 1;
            checklistViewModel.Questions[0].QuestionNumber = 1;
            checklistViewModel.Questions[1].CategoryNumber = 1;
            checklistViewModel.Questions[1].QuestionNumber = 2;
            checklistViewModel.Questions[2].CategoryNumber = 2;
            checklistViewModel.Questions[2].QuestionNumber = 1;

            var site = new Site { Id = 21L, SiteId = checklistViewModel.SiteId };
            _siteRepository
                .Setup(x => x.GetByPeninsulaSiteId((long)checklistViewModel.SiteId))
                .Returns(site);

            _checklistRepository
                .Setup(x => x.GetById(checklistViewModel.Id))
                .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());
            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.Questions.Count, Is.EqualTo(3));
            Assert.That(savedChecklist.Questions[0].Question.Id, Is.EqualTo(questions[0].Id));
            Assert.That(savedChecklist.Questions[0].CategoryNumber, Is.EqualTo(1));
            Assert.That(savedChecklist.Questions[0].QuestionNumber, Is.EqualTo(1));
            Assert.That(savedChecklist.Questions[1].Question.Id, Is.EqualTo(questions[1].Id));
            Assert.That(savedChecklist.Questions[1].CategoryNumber, Is.EqualTo(1));
            Assert.That(savedChecklist.Questions[1].QuestionNumber, Is.EqualTo(2));
            Assert.That(savedChecklist.Questions[2].Question.Id, Is.EqualTo(questions[2].Id));
            Assert.That(savedChecklist.Questions[2].CategoryNumber, Is.EqualTo(2));
            Assert.That(savedChecklist.Questions[2].QuestionNumber, Is.EqualTo(1));
        }

        [Test]
        public void Given_a_checklist_exists_when_a_question_is_removed_then_category_number_and_question_number_are_updated()
        {
            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            var questions = GetListOfQuestions();
            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });
            }

            checklist.Questions[0].CategoryNumber = 1;
            checklist.Questions[0].QuestionNumber = 1;
            checklist.Questions[1].CategoryNumber = 1;
            checklist.Questions[1].QuestionNumber = 2;
            checklist.Questions[2].CategoryNumber = 2;
            checklist.Questions[2].QuestionNumber = 1;

            _checklistRepository
              .Setup(x => x.GetById(checklist.Id))
              .Returns(checklist);


            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);      
            checklistViewModel.Id = checklist.Id;
            checklistViewModel.SiteId = 23;          
            checklistViewModel.Questions[0].CategoryNumber = 1;
            checklistViewModel.Questions[0].QuestionNumber = 1;
            checklistViewModel.Questions[1].CategoryNumber = 1;
            checklistViewModel.Questions[1].QuestionNumber = 2;
            checklistViewModel.Questions[2].CategoryNumber = 2;
            checklistViewModel.Questions[2].QuestionNumber = 1;

            checklistViewModel.Questions.RemoveAt(1);


            foreach (var question in questions)
            {
                _questionRepository
                    .Setup(x => x.GetById(question.Id))
                    .Returns(question);
            }

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklist.Id, checklistViewModel);

           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(checklist.Questions.Count(x => !x.Deleted), Is.EqualTo(2));

            Assert.That(checklist.Questions[0].Question.Id, Is.EqualTo(questions[0].Id));
            Assert.That(checklist.Questions[0].CategoryNumber, Is.EqualTo(1));
            Assert.That(checklist.Questions[0].QuestionNumber, Is.EqualTo(1));

            Assert.That(checklist.Questions[0].Deleted, Is.False);
            Assert.That(checklist.Questions[1].Deleted, Is.True);
            Assert.That(checklist.Questions[2].Deleted, Is.False);

            Assert.That(checklist.Questions[2].Question.Id, Is.EqualTo(questions[2].Id));
            Assert.That(checklist.Questions[2].CategoryNumber, Is.EqualTo(2));
            Assert.That(checklist.Questions[2].QuestionNumber, Is.EqualTo(1));
        }

        [Test]
        public void Given_a_checklist_exists_when_a_question_is_removed_and_others_are_moved_up_then_category_number_and_question_number_are_updated()
        {
            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            var questions = GetListOfQuestions();
            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });
            }

            checklist.Questions[0].CategoryNumber = 1;
            checklist.Questions[0].QuestionNumber = 1;
            checklist.Questions[1].CategoryNumber = 1;
            checklist.Questions[1].QuestionNumber = 2;
            checklist.Questions[2].CategoryNumber = 1;
            checklist.Questions[2].QuestionNumber = 3;

            _checklistRepository
              .Setup(x => x.GetById(checklist.Id))
              .Returns(checklist);


            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.Id = checklist.Id;
            checklistViewModel.SiteId = 23;
            checklistViewModel.Questions[0].CategoryNumber = 1;
            checklistViewModel.Questions[0].QuestionNumber = 1;
            checklistViewModel.Questions[1].CategoryNumber = 1;
            checklistViewModel.Questions[1].QuestionNumber = 2;
            checklistViewModel.Questions[2].CategoryNumber = 1;
            checklistViewModel.Questions[2].QuestionNumber = 2;

            checklistViewModel.Questions.RemoveAt(1);


            foreach (var question in questions)
            {
                _questionRepository
                    .Setup(x => x.GetById(question.Id))
                    .Returns(question);
            }

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklist.Id, checklistViewModel);

            Assert.That(checklist.Questions[0].Question.Id, Is.EqualTo(questions[0].Id));
            Assert.That(checklist.Questions[0].CategoryNumber, Is.EqualTo(1));
            Assert.That(checklist.Questions[0].QuestionNumber, Is.EqualTo(1));
        
            Assert.That(checklist.Questions[1].Question.Id, Is.EqualTo(questions[1].Id));
            Assert.That(checklist.Questions[1].Deleted, Is.EqualTo(true));

            Assert.That(checklist.Questions[2].Question.Id, Is.EqualTo(questions[2].Id));
            Assert.That(checklist.Questions[2].CategoryNumber, Is.EqualTo(1));
            Assert.That(checklist.Questions[2].QuestionNumber, Is.EqualTo(2));

        }

        [Test]
        public void Given_a_checklist_exists_when_a_question_is_added_then_category_number_or_question_number_are_added()
        {
            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            var questions = GetListOfQuestions();            
            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question});
            }

            checklist.Questions[0].CategoryNumber = 1;
            checklist.Questions[0].QuestionNumber = 1;
            checklist.Questions[1].CategoryNumber = 1;
            checklist.Questions[1].QuestionNumber = 2;
            checklist.Questions[2].CategoryNumber = 2;
            checklist.Questions[2].QuestionNumber = 1;

            _checklistRepository
              .Setup(x => x.GetById(checklist.Id))
              .Returns(checklist);

           
            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.Id = checklist.Id;
            checklistViewModel.Questions[0].CategoryNumber = 1;
            checklistViewModel.Questions[0].QuestionNumber = 1;
            checklistViewModel.Questions[1].CategoryNumber = 1;
            checklistViewModel.Questions[1].QuestionNumber = 2;
            checklistViewModel.Questions[2].CategoryNumber = 2;
            checklistViewModel.Questions[2].QuestionNumber = 1;

            //Add new questions to API.
            var newQuestionAnswer = GetQuestionAnswerViewModel();
            newQuestionAnswer.Answer = new AnswerViewModel();
            newQuestionAnswer.Answer.SelectedResponseId = newQuestionAnswer.Question.PossibleResponses[0].Id;
            newQuestionAnswer.CategoryNumber = 2;
            newQuestionAnswer.QuestionNumber = 2;

            checklistViewModel.Questions.Add(newQuestionAnswer);
            checklistViewModel.SiteId = (int)_peninsulaSiteId;
            checklistViewModel.Site = new SiteViewModel
            {
                Id = (int)_peninsulaSiteId,
                Address1 = "1 Green Lane",
                Postcode = "M1 1AA"
            };
            checklistViewModel.SiteVisit = new SiteVisitViewModel
            {
                VisitDate =  new DateTime(2000,2,14)
            };

            foreach (var question in questions)
            {
                _questionRepository
                    .Setup(x => x.GetById(question.Id))
                    .Returns(question);
            }

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklist.Id, checklistViewModel);

           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(checklist.Questions.Count, Is.EqualTo(4));

            Assert.That(checklist.Questions[0].Question.Id, Is.EqualTo(questions[0].Id));
            Assert.That(checklist.Questions[0].CategoryNumber, Is.EqualTo(1));
            Assert.That(checklist.Questions[0].QuestionNumber, Is.EqualTo(1));

            Assert.That(checklist.Questions[1].Question.Id, Is.EqualTo(questions[1].Id));
            Assert.That(checklist.Questions[1].CategoryNumber, Is.EqualTo(1));
            Assert.That(checklist.Questions[1].QuestionNumber, Is.EqualTo(2));

            Assert.That(checklist.Questions[2].Question.Id, Is.EqualTo(questions[2].Id));
            Assert.That(checklist.Questions[2].CategoryNumber, Is.EqualTo(2));
            Assert.That(checklist.Questions[2].QuestionNumber, Is.EqualTo(1));

            Assert.That(checklist.Questions[3].Question.Id, Is.EqualTo(newQuestionAnswer.Question.Id));
            Assert.That(checklist.Questions[3].CategoryNumber, Is.EqualTo(2));
            Assert.That(checklist.Questions[3].QuestionNumber, Is.EqualTo(2));
        }

        [Test]
        public void Given_a_checklist_exists_when_a_new_question_is_added_with_answer_Then_the_question_and_answer_is_added_to_the_checklist()
        {
            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            var questions = GetListOfQuestions();

            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });
            } 
            
            checklist.Questions[0].CategoryNumber = 1;
            checklist.Questions[0].QuestionNumber = 1;
            checklist.Questions[1].CategoryNumber = 1;
            checklist.Questions[1].QuestionNumber = 2;
            checklist.Questions[2].CategoryNumber = 2;
            checklist.Questions[2].QuestionNumber = 1;
            
            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.Id = checklist.Id;
            checklistViewModel.Questions[0].CategoryNumber = 1;
            checklistViewModel.Questions[0].QuestionNumber = 1;
            checklistViewModel.Questions[1].CategoryNumber = 1;
            checklistViewModel.Questions[1].QuestionNumber = 2;
            checklistViewModel.Questions[2].CategoryNumber = 2;
            checklistViewModel.Questions[2].QuestionNumber = 1;

            //Add new questions to API.
            var newQuestionAnswer = GetQuestionAnswerViewModel();
            newQuestionAnswer.Answer = new AnswerViewModel();
            newQuestionAnswer.Answer.SelectedResponseId = newQuestionAnswer.Question.PossibleResponses[0].Id;
            newQuestionAnswer.Answer.AreaOfNonCompliance = "You have 2 seconds to comply";
            newQuestionAnswer.Answer.SupportingDocumentationDate = DateTime.Now.AddDays(-12);
            newQuestionAnswer.Answer.SupportingDocumentationStatus = "Reported";
            checklistViewModel.Questions.Add(newQuestionAnswer);
            checklistViewModel.SiteId = 1; 

            checklistViewModel.Site = new SiteViewModel
            {
                Id = (int)_peninsulaSiteId,
                Address1 = "1 Green Lane",
                Postcode = "M1 1AA"
            };

            checklistViewModel.SiteId = (int)_peninsulaSiteId;

            checklistViewModel.SiteVisit = new SiteVisitViewModel
            {
                VisitDate =  new DateTime(2000,2,14)
            };

            _checklistRepository
                .Setup(x => x.GetById(checklist.Id))
                .Returns(checklist);

            foreach (var question in questions)
            {
                _questionRepository
                    .Setup(x => x.GetById(question.Id))
                    .Returns(()=>question);
            }

            var controller = GetTarget();
         
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklist.Id, checklistViewModel);
            
           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(checklist.Questions.Count, Is.EqualTo(4));
            Assert.That(checklist.Questions[0].Question.Id, Is.EqualTo(questions[0].Id));
            Assert.That(checklist.Questions[1].Question.Id, Is.EqualTo(questions[1].Id));
            Assert.That(checklist.Questions[2].Question.Id, Is.EqualTo(questions[2].Id));
            Assert.That(checklist.Questions[3].Question.Id, Is.EqualTo(newQuestionAnswer.Question.Id));
            Assert.That(checklist.Answers.Count, Is.EqualTo(1));
            Assert.That(checklist.Answers[0].Question, Is.EqualTo(checklist.Questions[3].Question));
            Assert.That(checklist.Answers[0].Response, Is.EqualTo(checklist.Questions[3].Question.PossibleResponses[0]));
            Assert.That(checklist.Questions[3].Question.SpecificToClientId, Is.EqualTo(newQuestionAnswer.Question.SpecificToClientId));
            Assert.That(checklist.Answers[0].AreaOfNonCompliance, Is.EqualTo(newQuestionAnswer.Answer.AreaOfNonCompliance));
            Assert.That(checklist.Answers[0].SupportingDocumentationDate, Is.EqualTo(newQuestionAnswer.Answer.SupportingDocumentationDate));
            Assert.That(checklist.Answers[0].SupportingDocumentationStatus, Is.EqualTo(newQuestionAnswer.Answer.SupportingDocumentationStatus));

        }

        [Test]
        public void Given_checklist_does_not_already_exists_in_database_When_PostChecklist_is_called_Then_new_checklist_is_created_with_questions_and_answers()
        {
            //Get view model
            var questions = GetListOfQuestions();
          
            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.SiteId = (int) _peninsulaSiteId;

            //Add new questions to API.
            var newQuestionAnswer = GetQuestionAnswerViewModel();
            checklistViewModel.Questions.Add(newQuestionAnswer);

            //Answer one of the questions.
            checklistViewModel.Questions[0].Answer = new AnswerViewModel();
            checklistViewModel.Questions[0].Answer.SelectedResponseId = questions[0].PossibleResponses[0].Id;
            checklistViewModel.Questions[0].Answer.ActionRequired = "Answer Action Required";
            checklistViewModel.Questions[0].Answer.SupportingEvidence = "Answer Supporting Evidence";
            checklistViewModel.Questions[0].Answer.GuidanceNotes = "Answer Guidance Notes";           
            checklistViewModel.Status = "Status 1";
            checklistViewModel.SiteId = 1;
            
            _checklistRepository
                .Setup(x => x.GetById(checklistViewModel.Id))
                .Returns((Checklist) null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x) { 
                        savedChecklist = x; 
                    }
                );

            var controller = GetTarget();

            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
            Assert.That(savedChecklist, Is.Not.Null); 
           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.Status, Is.EqualTo(checklistViewModel.Status));
            Assert.That(savedChecklist.Questions.Count, Is.EqualTo(4));

            for(int i = 0; i < 3; i ++)
            {
                Assert.That(savedChecklist.Questions[i].Question.Id, Is.EqualTo(questions[i].Id));
                Assert.That(savedChecklist.Questions[i].Question.Category.Id, Is.EqualTo(questions[i].Category.Id));                
                Assert.That(savedChecklist.Questions[i].Question.SpecificToClientId, Is.EqualTo(questions[i].SpecificToClientId));
                Assert.That(savedChecklist.Questions[i].Question.Title, Is.EqualTo(questions[i].Title));
                Assert.That(savedChecklist.Questions[i].Question.PossibleResponses.Count, Is.EqualTo(questions[i].PossibleResponses.Count));

                for(int j = 0; j < savedChecklist.Questions[i].Question.PossibleResponses.Count; j++)
                {
                    Assert.That(savedChecklist.Questions[i].Question.PossibleResponses[j].Id, Is.EqualTo(questions[i].PossibleResponses[j].Id));
                    Assert.That(savedChecklist.Questions[i].Question.PossibleResponses[j].Title, Is.EqualTo(questions[i].PossibleResponses[j].Title));
                    Assert.That(savedChecklist.Questions[i].Question.PossibleResponses[j].GuidanceNotes, Is.EqualTo(questions[i].PossibleResponses[j].GuidanceNotes));
                    Assert.That(savedChecklist.Questions[i].Question.PossibleResponses[j].ActionRequired, Is.EqualTo(questions[i].PossibleResponses[j].ActionRequired));
                    Assert.That(savedChecklist.Questions[i].Question.PossibleResponses[j].ResponseType, Is.EqualTo(questions[i].PossibleResponses[j].ResponseType));
                    Assert.That(savedChecklist.Questions[i].Question.PossibleResponses[j].SupportingEvidence, Is.EqualTo(questions[i].PossibleResponses[j].SupportingEvidence));
                }
            }

            //TODO: check this is right - asserting supporting evidence, guidance notes and action required from viewmodel, not from the possible response?
            Assert.That(savedChecklist.Answers.Count, Is.EqualTo(1));
            Assert.That(savedChecklist.Answers[0].Id, Is.Not.Null);
            Assert.That(savedChecklist.Answers[0].ActionRequired, Is.EqualTo(checklistViewModel.Questions[0].Answer.ActionRequired));
            Assert.That(savedChecklist.Answers[0].GuidanceNotes, Is.EqualTo(checklistViewModel.Questions[0].Answer.GuidanceNotes));
            Assert.That(savedChecklist.Answers[0].Question, Is.EqualTo(questions[0]));
            Assert.That(savedChecklist.Answers[0].Response, Is.EqualTo(questions[0].PossibleResponses[0]));
            Assert.That(savedChecklist.Answers[0].SupportingEvidence, Is.EqualTo(checklistViewModel.Questions[0].Answer.SupportingEvidence));
        }

        [Test]
        public void Given_checklist_and_impression_type_do_not_already_exists_in_database_When_PostChecklist_is_called_Then_site_visit_details_are_recorded()
        {
            //Get view model
            var questions = GetListOfQuestions();
            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.SiteId = (int) _peninsulaSiteId;

            //Add site visit details.
            checklistViewModel.SiteVisit = new SiteVisitViewModel();
            checklistViewModel.SiteVisit.VisitDate = new DateTime(2013, 10, 7);
            checklistViewModel.SiteVisit.VisitBy = "VisitBy 1";
            checklistViewModel.SiteVisit.VisitType = "Visit Type 1";
            checklistViewModel.SiteVisit.AreasVisited = "Areas Visited 1";
            checklistViewModel.SiteVisit.AreasNotVisited = "Areas Not Visited 1";
            checklistViewModel.SiteVisit.EmailAddress = "Email Address 1";
            checklistViewModel.SiteVisit.SelectedImpressionType = new ImpressionTypeViewModel { Id = _impressionTypes[0].Id };

            checklistViewModel.SiteId = 1;
            checklistViewModel.Site = new SiteViewModel
            {
                Id = 1,
                Address1 = "1 Green Lane",
                Postcode = "M1 1AA"
            };
            
            _checklistRepository
                .Setup(x => x.GetById(checklistViewModel.Id))
                .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
            Assert.That(savedChecklist, Is.Not.Null);
            Assert.That(savedChecklist.VisitDate, Is.EqualTo(new DateTime(2013, 10, 7)));
            Assert.That(savedChecklist.VisitBy, Is.EqualTo(checklistViewModel.SiteVisit.VisitBy));
            Assert.That(savedChecklist.VisitType, Is.EqualTo(checklistViewModel.SiteVisit.VisitType));
            Assert.That(savedChecklist.AreasVisited, Is.EqualTo(checklistViewModel.SiteVisit.AreasVisited));
            Assert.That(savedChecklist.AreasNotVisited, Is.EqualTo(checklistViewModel.SiteVisit.AreasNotVisited));
            Assert.That(savedChecklist.EmailAddress, Is.EqualTo(checklistViewModel.SiteVisit.EmailAddress));
            Assert.That(savedChecklist.ImpressionType, Is.EqualTo(_impressionTypes[0]));
            Assert.That(savedChecklist.ImpressionType.Id, Is.EqualTo(_impressionTypes[0].Id));
            Assert.That(savedChecklist.ImpressionType.Title, Is.EqualTo(_impressionTypes[0].Title));

        }

        [Test]
        public void Given_imediate_risk_notifications_are_included_in_request_for_new_checklist_When_PostChecklist_is_called_Then_IRNs_are_created()
        {
            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.ClientId = 161;
            checklistViewModel.SiteId = (int) _peninsulaSiteId;
            var irn1 = new ImmediateRiskNotificationViewModel();
            irn1.Id = Guid.NewGuid();
            irn1.Reference = "Reference 1";
            irn1.Title = "Title 1";
            irn1.SignificantHazard = "Significant Hazard Identified 1";
            irn1.RecommendedImmediate = "Recommended Immediate Action 1";
            var irn2 = new ImmediateRiskNotificationViewModel();
            irn2.Id = Guid.NewGuid();
            irn2.Reference = "Reference 2";
            irn2.Title = "Title 2";
            irn2.SignificantHazard = "Significant Hazard Identified 2";
            irn2.RecommendedImmediate = "Recommended Immediate Action 2";
            checklistViewModel.ImmediateRiskNotifications.Add(irn1);
            checklistViewModel.ImmediateRiskNotifications.Add(irn2);
            checklistViewModel.SiteId = 1;

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
            Assert.That(savedChecklist, Is.Not.Null);
           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.Status, Is.EqualTo(checklistViewModel.Status));
            Assert.That(savedChecklist.Questions.Count, Is.EqualTo(0));
            Assert.That(savedChecklist.ImmediateRiskNotifications, Is.Not.Null);
            Assert.That(savedChecklist.ImmediateRiskNotifications.Count, Is.EqualTo(2));
            Assert.That(savedChecklist.ImmediateRiskNotifications[0].Id, Is.EqualTo(irn1.Id));
            Assert.That(savedChecklist.ImmediateRiskNotifications[0].Title, Is.EqualTo(irn1.Title));
            Assert.That(savedChecklist.ImmediateRiskNotifications[0].Reference, Is.EqualTo(irn1.Reference));
            Assert.That(savedChecklist.ImmediateRiskNotifications[0].SignificantHazardIdentified, Is.EqualTo(irn1.SignificantHazard));
            Assert.That(savedChecklist.ImmediateRiskNotifications[0].RecommendedImmediateAction, Is.EqualTo(irn1.RecommendedImmediate));
            Assert.That(savedChecklist.ImmediateRiskNotifications[0].Checklist, Is.EqualTo(savedChecklist));
            Assert.That(savedChecklist.ImmediateRiskNotifications[1].Id, Is.EqualTo(irn2.Id));
            Assert.That(savedChecklist.ImmediateRiskNotifications[1].Title, Is.EqualTo(irn2.Title));
            Assert.That(savedChecklist.ImmediateRiskNotifications[1].Reference, Is.EqualTo(irn2.Reference));
            Assert.That(savedChecklist.ImmediateRiskNotifications[1].SignificantHazardIdentified, Is.EqualTo(irn2.SignificantHazard));
            Assert.That(savedChecklist.ImmediateRiskNotifications[1].RecommendedImmediateAction, Is.EqualTo(irn2.RecommendedImmediate));
            Assert.That(savedChecklist.ImmediateRiskNotifications[1].Checklist, Is.EqualTo(savedChecklist));
        }


        [Test]
        public void Given_imediate_risk_notifications_exist_in_existing_checklist_When_PostChecklist_is_called_Then_IRNs_are_created_and_deleted_and_remain_accordingly()
        {
            var checklist = new ChecklistForTest();

            var immediateRiskNotification1 = ImmediateRiskNotification.Create(
                Guid.NewGuid(),
                "Reference 1",
                "Title 1",
                "Significant Hazard Identified 1",
                "Recommended Immediate Action 1",
                checklist,
                new UserForAuditing());

            var immediateRiskNotificationToBeDeleted = ImmediateRiskNotification.Create(
                Guid.NewGuid(),
                "Reference 2",
                "Title 2",
                "Significant Hazard Identified 2",
                "Recommended Immediate Action 2",
                checklist,
                new UserForAuditing());

            checklist.AddImmediateRiskNotification(immediateRiskNotification1);
            checklist.AddImmediateRiskNotification(immediateRiskNotificationToBeDeleted);

            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.ClientId = 2323;
            checklistViewModel.SiteId = (int)_peninsulaSiteId;

            var immediateRiskNotificationViewModel1 = new ImmediateRiskNotificationViewModel();
            immediateRiskNotificationViewModel1.Id = immediateRiskNotification1.Id;
            immediateRiskNotificationViewModel1.Reference = immediateRiskNotification1.Reference;
            immediateRiskNotificationViewModel1.Title = immediateRiskNotification1.Title;
            immediateRiskNotificationViewModel1.SignificantHazard = immediateRiskNotification1.SignificantHazardIdentified;
            immediateRiskNotificationViewModel1.RecommendedImmediate = immediateRiskNotification1.RecommendedImmediateAction;

            var immediateRiskNotificationViewModel2 = new ImmediateRiskNotificationViewModel();
            immediateRiskNotificationViewModel2.Id = Guid.NewGuid();
            immediateRiskNotificationViewModel2.Reference = "Reference 3";
            immediateRiskNotificationViewModel2.Title = "Title 3";
            immediateRiskNotificationViewModel2.SignificantHazard = "Significant Hazard Identified 3";
            immediateRiskNotificationViewModel2.RecommendedImmediate = "Recommended Immediate Action 3";

            checklistViewModel.ImmediateRiskNotifications.Add(immediateRiskNotificationViewModel1);
            checklistViewModel.ImmediateRiskNotifications.Add(immediateRiskNotificationViewModel2);
            checklistViewModel.SiteId = 1;

            _checklistRepository
                .Setup(x => x.GetById(checklist.Id))
                .Returns(checklist);

            ChecklistForTest savedChecklist = null;

            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        var ewt = (ChecklistForTest) x;
                        savedChecklist = (ChecklistForTest) x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
            Assert.That(savedChecklist, Is.Not.Null);
           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.Status, Is.EqualTo(checklistViewModel.Status));
            Assert.That(savedChecklist.Questions.Count, Is.EqualTo(0));
            Assert.That(savedChecklist.ImmediateRiskNotifications, Is.Not.Null);
            Assert.That(savedChecklist.ImmediateRiskNotifications.Count, Is.EqualTo(2));
            Assert.That(savedChecklist.PrivateIRNList.Count, Is.EqualTo(3));
            Assert.That(savedChecklist.PrivateIRNList.Count(x => !x.Deleted), Is.EqualTo(2));
            Assert.That(savedChecklist.PrivateIRNList.Count(x => x.Deleted), Is.EqualTo(1));


            var savedIRN1 = savedChecklist.PrivateIRNList.First(x => x.Id == immediateRiskNotification1.Id);

            Assert.That(savedIRN1.Title, Is.EqualTo(immediateRiskNotificationViewModel1.Title));
            Assert.That(savedIRN1.Reference, Is.EqualTo(immediateRiskNotificationViewModel1.Reference));
            Assert.That(savedIRN1.SignificantHazardIdentified, Is.EqualTo(immediateRiskNotificationViewModel1.SignificantHazard));
            Assert.That(savedIRN1.RecommendedImmediateAction, Is.EqualTo(immediateRiskNotificationViewModel1.RecommendedImmediate));
            Assert.That(savedIRN1.Checklist, Is.EqualTo(savedChecklist));
            Assert.That(savedIRN1.Deleted, Is.False);

            var savedIRN2 = savedChecklist.PrivateIRNList.First(x => x.Id == immediateRiskNotificationToBeDeleted.Id);

            Assert.That(savedIRN2.Title, Is.EqualTo(immediateRiskNotificationToBeDeleted.Title));
            Assert.That(savedIRN2.Reference, Is.EqualTo(immediateRiskNotificationToBeDeleted.Reference));
            Assert.That(savedIRN2.SignificantHazardIdentified, Is.EqualTo(immediateRiskNotificationToBeDeleted.SignificantHazardIdentified));
            Assert.That(savedIRN2.RecommendedImmediateAction, Is.EqualTo(immediateRiskNotificationToBeDeleted.RecommendedImmediateAction));
            Assert.That(savedIRN2.Checklist, Is.EqualTo(savedChecklist));
            Assert.That(savedIRN2.Deleted, Is.True);

            var savedIRN3 = savedChecklist.PrivateIRNList.First(x => x.Id == immediateRiskNotificationViewModel2.Id);

            Assert.That(savedIRN3.Title, Is.EqualTo(immediateRiskNotificationViewModel2.Title));
            Assert.That(savedIRN3.Reference, Is.EqualTo(immediateRiskNotificationViewModel2.Reference));
            Assert.That(savedIRN3.SignificantHazardIdentified, Is.EqualTo(immediateRiskNotificationViewModel2.SignificantHazard));
            Assert.That(savedIRN3.RecommendedImmediateAction, Is.EqualTo(immediateRiskNotificationViewModel2.RecommendedImmediate));
            Assert.That(savedIRN3.Checklist, Is.EqualTo(savedChecklist));
            Assert.That(savedIRN3.Deleted, Is.False);
        }

        private ChecklistViewModel GetChecklistViewModelFromQuestions(List<Question> questions)
        {
            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.ClientId = 213;

            //Reconstruct the list of questions as it woul be posted to API.
            foreach (var question in questions)
            {
                var questionAnswer = new QuestionAnswerViewModel();
                questionAnswer.Question = new QuestionViewModel();
                questionAnswer.Question.Id = question.Id;
                questionAnswer.Question.Text = question.Title;
                questionAnswer.Question.PossibleResponses = new List<QuestionResponseViewModel>();

                foreach (var possibleResponse in question.PossibleResponses)
                {
                    questionAnswer.Question.PossibleResponses.Add(new QuestionResponseViewModel
                                                                      {
                                                                          Id = possibleResponse.Id, 
                                                                          Title = possibleResponse.Title,
                                                                          GuidanceNotes = possibleResponse.GuidanceNotes,
                                                                          ActionRequired = possibleResponse.ActionRequired,
                                                                          ResponseType = possibleResponse.ResponseType,
                                                                          SupportingEvidence = possibleResponse.SupportingEvidence
                                                                      });
                }

                questionAnswer.Question.Category = new CategoryViewModel();
                questionAnswer.Question.CategoryId = question.Category.Id;
                questionAnswer.Question.Category.Id = question.Category.Id;
                questionAnswer.Question.Category.Title = question.Category.Title;

                checklistViewModel.Questions.Add(questionAnswer);

                //questionAnswer.Answer = new AnswerViewModel();
                //questionAnswer.Answer.QuestionId = questionAnswer1.Question.Id;
            }

            return checklistViewModel;
        }

        private List<Question> GetListOfQuestions()
        {
            var questions = new List<Question>();

            questions.Add(new Question());
            questions[0].Id = Guid.NewGuid();
            questions[0].Title = "Question 1";            
            questions[0].PossibleResponses = new List<QuestionResponse>();

            questions[0].PossibleResponses.Add(
                    new QuestionResponse {
                        Id = Guid.NewGuid(), 
                        Title = "Response 1",
                        GuidanceNotes = "Guidance Notes 1",
                        ActionRequired = "Action Required 1",
                        Date = new DateTime(2010, 10, 1),
                        ResponseType = "Negative",
                        SupportingEvidence = "Supporting Evidence 1"
                        
                    });

            questions[0].PossibleResponses.Add(
                new QuestionResponse
                    {
                        Id = Guid.NewGuid(),
                        Title = "Response 2",
                        GuidanceNotes = "Guidance Notes 2",
                        ActionRequired = "Action Required 2",
                        Date = new DateTime(2010, 10, 2),
                        ResponseType = "Negative",
                        SupportingEvidence = "Supporting Evidence 2"
                    });

            questions[0].PossibleResponses.Add(
                new QuestionResponse
                    {
                        Id = Guid.NewGuid(),
                        Title = "Response 3",
                        GuidanceNotes = "Guidance Notes 3",
                        ActionRequired = "Action Required 3",
                        Date = new DateTime(2010, 10, 3),
                        ResponseType = "Positive",
                        SupportingEvidence = "Supporting Evidence 3"
                    });

            questions[0].Category = _categories[0];

            questions.Add(new Question());
            questions[1].Id = Guid.NewGuid();
            questions[1].Title = "Question 2";
            questions[1].PossibleResponses = new List<QuestionResponse>();
            questions[1].PossibleResponses.Add(new QuestionResponse {Id = Guid.NewGuid(), Title = "Response 1"});
            questions[1].PossibleResponses.Add(new QuestionResponse {Id = Guid.NewGuid(), Title = "Response 2"});
            questions[1].PossibleResponses.Add(new QuestionResponse {Id = Guid.NewGuid(), Title = "Response 3"});
            questions[1].Category = _categories[0];

            questions.Add(new Question());
            questions[2].Id = Guid.NewGuid();
            questions[2].Title = "Question 3";
            questions[2].PossibleResponses = new List<QuestionResponse>();
            questions[2].PossibleResponses.Add(new QuestionResponse {Id = Guid.NewGuid(), Title = "Response 1"});
            questions[2].PossibleResponses.Add(new QuestionResponse {Id = Guid.NewGuid(), Title = "Response 2"});
            questions[2].PossibleResponses.Add(new QuestionResponse {Id = Guid.NewGuid(), Title = "Response 3"});
            questions[2].Category = _categories[1];
            return questions;
        }

        private QuestionAnswerViewModel GetQuestionAnswerViewModel()
        {
            var newQuestionAnswer = new QuestionAnswerViewModel();
            newQuestionAnswer.Question = new QuestionViewModel();
            newQuestionAnswer.Question.Id = Guid.NewGuid();
            newQuestionAnswer.Question.Text = "New Question";
            newQuestionAnswer.Question.SpecificToClientId = 8325L;
            newQuestionAnswer.Question.PossibleResponses = new List<QuestionResponseViewModel>();
            newQuestionAnswer.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            newQuestionAnswer.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            newQuestionAnswer.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            newQuestionAnswer.Question.Category = new CategoryViewModel();
            newQuestionAnswer.Question.CategoryId = _categories[1].Id;
            newQuestionAnswer.Question.Category.Id = _categories[1].Id;
            newQuestionAnswer.Question.Category.Title = _categories[1].Title;
           

            return newQuestionAnswer;
        }

        [Ignore]
        [Test]
        //TODO: finish
        public void Given_a_valid_view_model_is_supplied_When_PostChecklist_is_called_Then_the_checklist_is_created()
        {
            var category1 = new CategoryViewModel();
            category1.Id = Guid.NewGuid();
            category1.Title = "Category 1";
            var category2 = new CategoryViewModel();
            category2.Id = Guid.NewGuid();
            category2.Title = "Category 2";

            var checklistViewModel = new ChecklistViewModel()
                                         {
                                             Id = Guid.NewGuid(),
                                             ClientId = 21323,
                                             SiteId = 2313
                                         };

            var questionAnswer1 = new QuestionAnswerViewModel();
            questionAnswer1.Question = new QuestionViewModel();
            questionAnswer1.Question.Id = Guid.NewGuid();
            questionAnswer1.Question.Text = "Question 1";
            questionAnswer1.Question.PossibleResponses = new List<QuestionResponseViewModel>();
            questionAnswer1.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer1.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer1.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer1.Question.Category = category1;
            questionAnswer1.Question.CategoryId = category1.Id;
            questionAnswer1.Answer = new AnswerViewModel();
            questionAnswer1.Answer.QuestionId = questionAnswer1.Question.Id;

            var questionAnswer2 = new QuestionAnswerViewModel();
            questionAnswer2.Question = new QuestionViewModel();
            questionAnswer2.Question.Id = Guid.NewGuid();
            questionAnswer2.Question.Text = "Question 2";
            questionAnswer2.Question.PossibleResponses = new List<QuestionResponseViewModel>();
            questionAnswer2.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer2.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer2.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer2.Question.Category = category2;
            questionAnswer2.Question.CategoryId = category2.Id;
            questionAnswer2.Answer = new AnswerViewModel();
            questionAnswer2.Answer.QuestionId = questionAnswer2.Question.Id;

            var controller = GetTarget();

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
        }

        [Test]
        public void Given_a_Valid_ActionPlan_Exists_Then_Create_Actions_For_ActionPlan()
        {
            

            _timescaleRepositories.Setup(x => x.GetById(It.IsAny<long>()))
                .Returns(new Timescale() {Id = 1, Name = "One Month"});

            var category1 = new CategoryViewModel();
            category1.Id = Guid.NewGuid();
            category1.Title = "Category 1";
            var category2 = new CategoryViewModel();
            category2.Id = Guid.NewGuid();
            category2.Title = "Category 2";

            //Get view model
            var questions = GetListOfQuestions();

            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.SiteId = 234234;
            checklistViewModel.ClientId = 11;
            checklistViewModel.CoveringLetterContent = "Letter content";
            checklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();
            checklistViewModel.Questions = new List<QuestionAnswerViewModel>();
            checklistViewModel.CreatedOn = DateTime.Now;
            checklistViewModel.CreatedBy = "user";
            checklistViewModel.SiteId = 1;
            checklistViewModel.Id = Guid.NewGuid();

            checklistViewModel.Site = new SiteViewModel
            {
                Id = checklistViewModel.SiteId.Value,
                Address1 = "1 Green Lane",
                Postcode = "M1 1AA"
            };

            checklistViewModel.SiteVisit = new SiteVisitViewModel
            {
                VisitDate =  new DateTime(2000,2,14)
            };

            checklistViewModel.Submit = true;

            var responseId = Guid.NewGuid();

            var questionAnswer1 = new QuestionAnswerViewModel();
            questionAnswer1.Question = new QuestionViewModel();
            questionAnswer1.Question.Id = Guid.NewGuid();
            questionAnswer1.Question.Text = "Question 1";
            questionAnswer1.Question.PossibleResponses = new List<QuestionResponseViewModel>();
            questionAnswer1.Question.PossibleResponses.Add(item: new QuestionResponseViewModel { Id = responseId, ResponseType = ResponseType.ImprovementRequired.ToString(), Title = "Improvement Required" });
            questionAnswer1.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer1.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });

            questionAnswer1.Question.Category = category1;
            questionAnswer1.Question.CategoryId = category1.Id;
            questionAnswer1.Answer = new AnswerViewModel();
            questionAnswer1.Answer.QuestionId = questionAnswer1.Question.Id;
            questionAnswer1.Answer.ActionRequired = "ActionRequired 1";
            questionAnswer1.Answer.GuidanceNotes = "GuidanceNotes 1.1";
            questionAnswer1.Answer.Timescale = new TimescaleViewModel() { Id = 1, Name = "One Month" };
            questionAnswer1.Answer.AssignedTo = new AssignedToViewModel()
            {
                Id = Guid.NewGuid(),
                NonEmployeeName = "Name 1"
            };
            questionAnswer1.Answer.SelectedResponseId = responseId;

            var questions1 = new List<QuestionAnswerViewModel>();
            questions1.Add(questionAnswer1);

            var responseId2 = Guid.NewGuid();

            var questionAnswer2 = new QuestionAnswerViewModel();
            questionAnswer2.Question = new QuestionViewModel();
            questionAnswer2.Question.Id = Guid.NewGuid();
            questionAnswer2.Question.Text = "Question 2";
            questionAnswer2.Question.PossibleResponses = new List<QuestionResponseViewModel>();
            questionAnswer2.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = responseId2, ResponseType = ResponseType.ImprovementRequired.ToString(), Title = "Improvement Required" });
            questionAnswer2.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer2.Question.PossibleResponses.Add(new QuestionResponseViewModel { Id = Guid.NewGuid() });
            questionAnswer2.Question.Category = category2;
            questionAnswer2.Question.CategoryId = category2.Id;
            questionAnswer2.Answer = new AnswerViewModel();
            questionAnswer2.Answer.QuestionId = questionAnswer2.Question.Id;
            questionAnswer2.Answer.ActionRequired = "ActionRequired 2";
            questionAnswer2.Answer.GuidanceNotes = "GuidanceNotes 2.2";
            questionAnswer2.Answer.Timescale = new TimescaleViewModel() { Id = 1, Name = "One Month" };
            questionAnswer2.Answer.AssignedTo = new AssignedToViewModel()
            {
                Id = Guid.NewGuid(),
                NonEmployeeName = "Name 2"
            };
            questionAnswer2.Answer.SelectedResponseId = responseId2;
            
            checklistViewModel.Questions.Add(questionAnswer1);
            checklistViewModel.Questions.Add(questionAnswer2);
            
            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            _categoryRepository
                   .Setup(x => x.GetById(It.IsAny<Guid>()))
                   .Returns(new Category());

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.ActionPlan.Actions, Is.Not.Null);
            Assert.That(savedChecklist.ActionPlan.Title, Is.EqualTo("Visit Report - 1 Green Lane - M1 1AA - 14/02/2000"));
            Assert.That(savedChecklist.ActionPlan.Actions.Count(), Is.EqualTo(2));
        }
        
        
        [Test]
        public void Given_IRNs_Exist_When_Submitted_Then_Create_IRN_Actions_For_ActionPlan()
        {
            //Get view model
            var questions = GetListOfQuestions();

            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.SiteId = 234234;
            checklistViewModel.ClientId = 11;
            checklistViewModel.CoveringLetterContent = "Letter content";
            checklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();
            checklistViewModel.Questions = new List<QuestionAnswerViewModel>();
            checklistViewModel.CreatedOn = DateTime.Now;
            checklistViewModel.CreatedBy = "user";
            checklistViewModel.SiteId = 1;
            checklistViewModel.Id = Guid.NewGuid();
            checklistViewModel.LastModifiedOn = DateTime.Now;

            checklistViewModel.Site = new SiteViewModel
            {
                Id = checklistViewModel.SiteId.Value,
                Address1 = "1 Green Lane",
                Postcode = "M1 1AA"
            };

            checklistViewModel.SiteVisit = new SiteVisitViewModel
            {
                VisitDate =  new DateTime(2000,2,14)
            };

            checklistViewModel.Submit = true;

            checklistViewModel.ImmediateRiskNotifications = new List<ImmediateRiskNotificationViewModel>();
            var irn1 = Guid.NewGuid();
            checklistViewModel.ImmediateRiskNotifications.Add(new ImmediateRiskNotificationViewModel()
                                                                {
                                                                    Id = irn1,
                                                                    RecommendedImmediate = "ImmediateAction",
                                                                    Reference = "Ref 1",
                                                                    SignificantHazard = "Hazard 1",
                                                                    Title = "Title 1"
                                                                });
            var irn2 = Guid.NewGuid();
            checklistViewModel.ImmediateRiskNotifications.Add(new ImmediateRiskNotificationViewModel()
                                                                {
                                                                    Id = irn2,
                                                                    RecommendedImmediate = "ImmediateRisk 2",
                                                                    Reference = "Ref 2",
                                                                    SignificantHazard = "Hazard 2",
                                                                    Title = "Title 2"
                                                                });


            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.ActionPlan.Actions.Count(),  Is.EqualTo(2));
            Assert.That(savedChecklist.ActionPlan.Actions.ElementAt(0).Reference, Is.EqualTo(checklistViewModel.ImmediateRiskNotifications.ElementAt(0).Reference));
            Assert.That(savedChecklist.ActionPlan.Actions.ElementAt(0).Category, Is.EqualTo(ActionCategory.ImmediateRiskNotification));
            Assert.That(savedChecklist.ActionPlan.Actions.ElementAt(1).Reference, Is.EqualTo(checklistViewModel.ImmediateRiskNotifications.ElementAt(1).Reference));
            Assert.That(savedChecklist.ActionPlan.Actions.ElementAt(1).Category, Is.EqualTo(ActionCategory.ImmediateRiskNotification));
        }

        [Test]
        public void When_PostChecklist_is_called_Then_GetFilename_and_GetBytes_are_called()
        {
            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.Id = Guid.NewGuid();
            checklistViewModel.SiteId = (int)_peninsulaSiteId;
            checklistViewModel.ClientId = 342;
            checklistViewModel.Submit = true;

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );


            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);

            _checklistPdfCreator.VerifySet(x => x.ChecklistViewModel = checklistViewModel);            
            _checklistPdfCreator.Verify(x => x.GetBytes());
            _clientDocumentationChecklistPdfWriter.Verify(x => x.WriteToClientDocumentation(savedChecklist.Title.Replace("/", "") + ".pdf", It.IsAny<byte[]>(), checklistViewModel.ClientId.Value, checklistViewModel.SiteId));
        }

        [Ignore]
        [Test]
        public void Given_a_checklist_question_was_created_but_the_question_responses_werent_then_responses_are_saved()
        {
            var existingQuestionId = Guid.NewGuid();
            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.SiteId = 234234;
            checklistViewModel.ClientId = 11;
            checklistViewModel.CoveringLetterContent = "Letter content";
            checklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();
            checklistViewModel.Questions = new List<QuestionAnswerViewModel>();
            checklistViewModel.CreatedOn = DateTime.Now;
            checklistViewModel.CreatedBy = "user";
            checklistViewModel.SiteId = 1;
            checklistViewModel.Id = Guid.NewGuid();
            checklistViewModel.Questions = new List<QuestionAnswerViewModel>()
                                               {
                                                   new QuestionAnswerViewModel
                                                       {
                                                           Question = new QuestionViewModel()
                                                                          {
                                                                              Id = existingQuestionId
                                                                              ,CategoryId = Guid.NewGuid()
                                                                              , PossibleResponses = new List<QuestionResponseViewModel>()
                                                                                                        {
                                                                                                            new QuestionResponseViewModel(){Id = Guid.NewGuid(), Title = "Response1"},
                                                                                                            new QuestionResponseViewModel(){Id = Guid.NewGuid(), Title = "Response2"}
                                                                                                        }
                                                                          }
                                                       }
                                               };

            _categoryRepository
                   .Setup(x => x.GetById(It.IsAny<Guid>()))
                   .Returns(new Category());

            _questionRepository.Setup(x => x.GetById(existingQuestionId))
                .Returns(new Question() { Id = existingQuestionId });


            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );


            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.Questions[0].Question.PossibleResponses.Count, Is.EqualTo(2));

        }


        [Test]
        public void Given_a_checklist_question_was_created_with_invalid_response_then_checklist_is_saved()
        {
            var existingQuestionId = Guid.NewGuid();
            var existingResponseId = Guid.NewGuid();
            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.SiteId = 234234;
            checklistViewModel.ClientId = 11;
            checklistViewModel.CoveringLetterContent = "Letter content";
            checklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();
            checklistViewModel.Questions = new List<QuestionAnswerViewModel>();
            checklistViewModel.CreatedOn = DateTime.Now;
            checklistViewModel.CreatedBy = "user";
            checklistViewModel.SiteId = 1;
            checklistViewModel.Id = Guid.NewGuid();
            checklistViewModel.Questions = new List<QuestionAnswerViewModel>()
                                               {
                                                   new QuestionAnswerViewModel
                                                       {
                                                           Question = new QuestionViewModel()
                                                                          {
                                                                              Id = existingQuestionId
                                                                              ,CategoryId = Guid.NewGuid()
                                                                              , PossibleResponses = new List<QuestionResponseViewModel>()
                                                                                                        {
                                                                                                            new QuestionResponseViewModel(){Id = Guid.NewGuid(), Title = "Response1"}
                                                                                                        }
                                                                          }
                                                       }
                                               };

            _categoryRepository
                   .Setup(x => x.GetById(It.IsAny<Guid>()))
                   .Returns(new Category());

            var existingQuestion = new Question()
                                       {
                                           Id = existingQuestionId,
                                           PossibleResponses =
                                               new List<QuestionResponse>
                                                   {new QuestionResponse {Id = existingResponseId, Title = "Response1"}}
                                       };

            _questionRepository.Setup(x => x.GetById(existingQuestionId))
                .Returns(existingQuestion);


            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                        {
                            savedChecklist = x;
                        }
                );


            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
           // Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.Questions[0].Question.PossibleResponses.Count, Is.EqualTo(1));
            Assert.That(savedChecklist.Questions[0].Question.PossibleResponses[0].Id, Is.EqualTo(existingResponseId));

        }

        [Test]
        public void Given_a_checklist_exists_when_a_qa_comment_is_added_to_an_answer_Then_the_checklist_is_updated()
        {
            var qaAdvisorId = Guid.NewGuid();
            _qaAdvisorRepository.Setup(x => x.GetById(It.IsAny<Guid>())).Returns(new QaAdvisor() { Id = qaAdvisorId });

            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            var questions = GetListOfQuestions();
            var questionAnswered = questions[0];

            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });
            }

            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.SiteId = 1;

            checklistViewModel.Site = new SiteViewModel
            {
                Id = (int)_peninsulaSiteId,
                Address1 = "1 Green Lane",
                Postcode = "M1 1AA"
            };

            checklistViewModel.SiteId = (int)_peninsulaSiteId;

            checklistViewModel.SiteVisit = new SiteVisitViewModel
            {
                VisitDate = new DateTime(2000,2,14)
            };

            checklist.Answers.Add(new ChecklistAnswer() {Question = questionAnswered});

            _checklistRepository
                .Setup(x => x.GetById(checklist.Id))
                .Returns(checklist);

            foreach (var question in questions)
            {
                _questionRepository
                    .Setup(x => x.GetById(question.Id))
                    .Returns(question);
            }

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            checklistViewModel.Questions[0].Answer = new AnswerViewModel
            {
                SelectedResponseId = questionAnswered.PossibleResponses[0].Id,
                QaComments = "Test QA Comments",
                QuestionId = questionAnswered.Id,
                QaSignedOffBy = "abc"

            };

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklist.Id, checklistViewModel);

           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.Answers.Count, Is.EqualTo(1));
            Assert.That(savedChecklist.Answers[0].Response, Is.EqualTo(questions[0].PossibleResponses[0]));
            Assert.That(savedChecklist.Answers[0].QaComments, Is.EqualTo("Test QA Comments"));
            Assert.That(savedChecklist.Answers[0].QaSignedOffBy, Is.EqualTo(checklistViewModel.Questions[0].Answer.QaSignedOffBy));
        }

        [Test]
        public void Given_a_checklist_exists_with_questions_and_categoryNumber_and_QuestionNumber_are_null_questions_not_removed()
        {
            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            var checklistQuestionId = Guid.NewGuid();
            var question = new Question() {Id = Guid.NewGuid()};

            checklist.Questions.Add(new ChecklistQuestion { Id= checklistQuestionId, Checklist = checklist, Question = question });

            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.SiteId = 1;

            checklistViewModel.Site = new SiteViewModel();
            checklistViewModel.SiteId = (int)_peninsulaSiteId;
            checklistViewModel.SiteVisit = new SiteVisitViewModel { VisitDate =  new DateTime(2000,2,14) };

            _checklistRepository
                .Setup(x => x.GetById(checklist.Id))
                .Returns(checklist);

     
                _questionRepository
                    .Setup(x => x.GetById(question.Id))
                    .Returns(question);
            

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            checklistViewModel.Questions.Add(new QuestionAnswerViewModel()
            {
                Question = new QuestionViewModel()
                {
                    Id = question.Id
                }
            });
            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var response = controller.PostChecklist(checklist.Id, checklistViewModel);

            Assert.IsTrue(checklist.Questions.All(x => x.Id == checklistQuestionId && x.Deleted == false));
        }


        [Test]
        public void Given_a_checklist_exists_when_a_custom_questions_possible_response_is_update_Then_the_checklist_is_updated()
        {
            var responseIdOfQuestionToBeUpdated = Guid.NewGuid();
            Question question = new Question();
            question.Id = Guid.NewGuid();
            question.Title = "Question 1";
            question.PossibleResponses = new List<QuestionResponse>();
            question.CustomQuestion = true;

            question.PossibleResponses.Add(
                    new QuestionResponse
                    {
                        Id = Guid.NewGuid(),
                        ReportLetterStatement = null
                    });

            question.PossibleResponses.Add(
               new QuestionResponse
               {
                   Id = Guid.NewGuid(),
                   ReportLetterStatement = null
               });

            question.PossibleResponses.Add(
                new QuestionResponse
                {
                    Id = responseIdOfQuestionToBeUpdated,
                    ReportLetterStatement = "to be updated"
                });

           

            question.Category = _categories[0];

            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
           
            checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });
           
            _checklistRepository
                .Setup(x => x.GetById(checklist.Id))
                .Returns(checklist);
          
          
                _questionRepository
                    .Setup(x => x.GetById(question.Id))
                    .Returns(question);
         
            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );



            foreach (var questionResponse in question.PossibleResponses)
            {               
                _questionResponseRepository
                    .Setup(x => x.GetById(questionResponse.Id))
                    .Returns(questionResponse);
            }
            
            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            ChecklistViewModel checklistViewModel = new ChecklistViewModel();
            checklistViewModel.SiteId = 1;
            checklistViewModel.Site = new SiteViewModel();
            checklistViewModel.SiteId = (int)_peninsulaSiteId;
            checklistViewModel.SiteVisit = new SiteVisitViewModel { VisitDate =  new DateTime(2000,2,14) };


            checklistViewModel.Questions.Add(new QuestionAnswerViewModel()
            {
                Question = new QuestionViewModel()
                {
                    Id = question.Id,
                    PossibleResponses = question.PossibleResponses.Select(x => new QuestionResponseViewModel() { Id = x.Id, ReportLetterStatement = x.ReportLetterStatement}).ToList()
                }
            });

            checklistViewModel.Questions[0].Question.PossibleResponses.First(x => x.Id == responseIdOfQuestionToBeUpdated).ReportLetterStatement = "updated Report Letter statement";

            var response = controller.PostChecklist(checklist.Id, checklistViewModel);

            savedChecklist.Questions[0].Question.PossibleResponses.ToList()
                .ForEach(x => Debug.WriteLine(x.ReportLetterStatement));

           Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedChecklist.Questions.Count, Is.EqualTo(1));
            Assert.That(savedChecklist.Questions[0].Question.PossibleResponses.First(x => x.Id == responseIdOfQuestionToBeUpdated).ReportLetterStatement, Is.EqualTo("updated Report Letter statement"));
            Assert.That(savedChecklist.Questions[0].Question.PossibleResponses.First(x => x.Id != responseIdOfQuestionToBeUpdated).ReportLetterStatement, Is.EqualTo(null));
        }

        /// <summary>
        /// this test covers the bug that resulted in the QaSignedOffBy looking like this David Brierley_06/12/2013 00:00:00_06/12/2013 00:00:00_06/12/2013 00:00:00_09/12/2013 00:00:00
        /// </summary>
        [Test]
        public void Given_a_question_has_been_signed_off_and_the_model_is_the_new_data_format_then_the_QaSignedOffBy_property_is_updated()
        {
            //GIVEN
            var questionId = Guid.NewGuid();
            var oldFormatQaSignedOffBy = "David Brierley_06/12/2013 00:00:00_09/12/2013 00:00:00_09/12/2013 00:00:00_09/12/2013 00:00:00";
            var expectedValue = "David Brierley";
            var expectedSignedOffDate = new DateTime(2013, 12, 9);
            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            checklist.Answers.Add(new ChecklistAnswer()
                                      {
                                          QaSignedOffBy = oldFormatQaSignedOffBy,
                                          Question = new Question() {Id = questionId}
                                      });

            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.SiteId = 12312;
            checklistViewModel.Questions.Add(new QuestionAnswerViewModel()
                                                 {
                                                     Question = new QuestionViewModel() {Id = questionId}
                                                     ,
                                                     Answer = new AnswerViewModel() { QuestionId = questionId, QaSignedOffBy = expectedValue, QaSignedOffDate = expectedSignedOffDate }
                                                 });


            _questionRepository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns((Guid id) => new Question() {Id = id});

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                        {
                            savedChecklist = x;
                        }
                );

            var target = GetTarget();
            target.Request = new HttpRequestMessage();
            target.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            target.PostChecklist(checklistViewModel.Id, checklistViewModel);

            //THEN
            Assert.That(savedChecklist.Answers[0].QaSignedOffBy, Is.EqualTo(expectedValue));
            Assert.That(savedChecklist.Answers[0].QaSignedOffDate, Is.EqualTo(expectedSignedOffDate));

        }

        [Test]
        public void Given_a_question_has_been_signed_off_and_the_model_is_the_old_data_format_then_the_QaSignedOffBy_property_is_updated()
        {
            //GIVEN
            var questionId = Guid.NewGuid();
            var oldFormatQaSignedOffBy = "David Brierley_06/12/2013 00:00:00_09/12/2013 00:00:00_09/12/2013 00:00:00_09/12/2013 00:00:00";
            var expectedValue = "David Brierley";
            var expectedSignedOffDate = new DateTime(2013, 12, 6);
            var checklist = new Checklist();
            checklist.Id = Guid.NewGuid();
            checklist.Answers.Add(new ChecklistAnswer()
            {
                QaSignedOffBy = oldFormatQaSignedOffBy,
                Question = new Question() { Id = questionId }
            });

            var checklistViewModel = new ChecklistViewModel();
            checklistViewModel.SiteId = 12312;
            checklistViewModel.Questions.Add(new QuestionAnswerViewModel()
            {
                Question = new QuestionViewModel() { Id = questionId }
                ,
                Answer = new AnswerViewModel() { QuestionId = questionId, QaSignedOffBy = oldFormatQaSignedOffBy }
            });
            
            _questionRepository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns((Guid id) => new Question() { Id = id });

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var target = GetTarget();
            target.Request = new HttpRequestMessage();
            target.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            target.PostChecklist(checklistViewModel.Id, checklistViewModel);

            //THEN
            Assert.That(savedChecklist.Answers[0].QaSignedOffBy, Is.EqualTo(expectedValue));
            Assert.That(savedChecklist.Answers[0].QaSignedOffDate, Is.EqualTo(expectedSignedOffDate));

        }

        [Test]
        public void Given_checklist_is_submitted_when_post_checklist_is_called_execpion_is_thrown()
        {
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.CoveringLetterContent = "covering letter content 1";
            viewModel.Status = "Test status 1";
            viewModel.QAComments = "qa comments tests";
            viewModel.UpdatesRequired = false;

            _checklistRepository
                .Setup(x => x.GetById(viewModel.Id))
                .Returns(new Checklist{Id = Guid.NewGuid(), Status = Checklist.STATUS_SUBMITTED});

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());
            
            Assert.Throws<HttpResponseException>(() => controller.PostChecklist(viewModel.Id, viewModel));
        }

        [Test]
        public void Given_IRNs_exist_when_checklist_completed_then_notification_email_is_sent()
        {
            //Get view model
            var questions = GetListOfQuestions();

            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.SiteId = 234234;
            checklistViewModel.ClientId = 11;
            checklistViewModel.CoveringLetterContent = "Letter content";
            checklistViewModel.Categories = new List<CategoryQuestionAnswerViewModel>();
            checklistViewModel.Questions = new List<QuestionAnswerViewModel>();
            checklistViewModel.CreatedOn = DateTime.Now;
            checklistViewModel.CreatedBy = "user";
            checklistViewModel.SiteId = 1;
            checklistViewModel.Id = Guid.NewGuid();

            checklistViewModel.Site = new SiteViewModel
            {
                Id = checklistViewModel.SiteId.Value,
                Address1 = "1 Green Lane",
                Postcode = "M1 1AA"
            };

            checklistViewModel.SiteVisit = new SiteVisitViewModel
            {
                VisitDate = new DateTime(2000, 2, 14)
            };
            
            checklistViewModel.ImmediateRiskNotifications = new List<ImmediateRiskNotificationViewModel>();
            var irn1 = Guid.NewGuid();
            checklistViewModel.ImmediateRiskNotifications.Add(new ImmediateRiskNotificationViewModel()
            {
                Id = irn1,
                RecommendedImmediate = "ImmediateAction",
                Reference = "Ref 1",
                SignificantHazard = "Hazard 1",
                Title = "Title 1"
            });
            var irn2 = Guid.NewGuid();
            checklistViewModel.ImmediateRiskNotifications.Add(new ImmediateRiskNotificationViewModel()
            {
                Id = irn2,
                RecommendedImmediate = "ImmediateRisk 2",
                Reference = "Ref 2",
                SignificantHazard = "Hazard 2",
                Title = "Title 2"
            });

            checklistViewModel.Status = "Completed";

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var result = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);
            _bus.Verify(x => x.Send(It.IsAny<SendIRNNotificationEmail>()), Times.Once);
        }    

        [Test]
        public void Given__email_person_seen_when_submit_checklist_then_email_is_sent()
        {
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.CoveringLetterContent = "covering letter content 1";
            viewModel.QAComments = "qa comments tests";
            viewModel.UpdatesRequired = false;
            viewModel.Submit = true;
            viewModel.EmailReportToPerson = true;
            _checklistRepository
                .Setup(x => x.GetById(viewModel.Id))
                .Returns(new Checklist { Id = Guid.NewGuid(), EmailReportToPerson = true });

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var result = controller.PostChecklist(viewModel.Id, viewModel);
            _bus.Verify(x => x.Send(It.IsAny<SendSubmitChecklistEmail>()), Times.Once);
        }

        [Test]
        public void Given_post_report_when_submit_checklist_then_email_is_sent()
        {
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.CoveringLetterContent = "covering letter content 1";
            viewModel.QAComments = "qa comments tests";
            viewModel.UpdatesRequired = false;
            viewModel.Submit = true;

            viewModel.PostReport = true;

            _checklistRepository
                .Setup(x => x.GetById(viewModel.Id))
                .Returns(new Checklist { Id = Guid.NewGuid(), EmailReportToPerson = true });

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            var result = controller.PostChecklist(viewModel.Id, viewModel);
            _bus.Verify(x => x.Send(It.IsAny<SendHardCopyToOfficeEmail>()), Times.Once);
        }

        [Test]
        public void Given_main_person_seen_is_null_when_PostChecklist_then_personName_is_null_and_mainPersonSeen_is_null()
        {
            //GIVEN
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_DRAFT;
            viewModel.SiteVisit = new SiteVisitViewModel()
            {
                PersonSeen = new PersonSeenViewModel() { Id = null, Name = "Boros Blunt" }
            };

            _checklistRepository
               .Setup(x => x.GetById(viewModel.Id))
               .Returns(new Checklist { Id = viewModel.Id, Status = Checklist.STATUS_DRAFT });

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.MainPersonSeen, Is.EqualTo(null));
            Assert.That(savedChecklist.MainPersonSeenName, Is.EqualTo(null));

        }

        [Test]
        public void Given_main_person_seen_is_not_an_employee_PostChecklist_then_personName_is_set_and_mainPersonSeen_is_null()
        {
            //GIVEN
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_DRAFT;
            viewModel.SiteVisit = new SiteVisitViewModel()
            {
                PersonSeen = new PersonSeenViewModel() {Id = Guid.Empty, Name = "Boros Blunt"}
            };

            _checklistRepository
               .Setup(x => x.GetById(viewModel.Id))
               .Returns(new Checklist { Id = viewModel.Id, Status = Checklist.STATUS_DRAFT });

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            controller.PostChecklist(viewModel.Id, viewModel);
            
            //THEN
            Assert.That(savedChecklist.MainPersonSeen, Is.EqualTo(null));
            Assert.That(savedChecklist.MainPersonSeenName, Is.EqualTo("Boros Blunt"));
        }

        [Test]
        public void Given_main_person_seen_is_an_employee_PostChecklist_then_personName_is_set_and_mainPersonSeen_is_null()
        {
            //GIVEN
            var personSeenViewModel = new PersonSeenViewModel() {Id = Guid.NewGuid(), Name = "Boros Blunt"};
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_DRAFT;
            viewModel.SiteVisit = new SiteVisitViewModel()
            {
                PersonSeen = personSeenViewModel
            };

            _employeeRespository
                .Setup(x => x.GetById(personSeenViewModel.Id.Value))
                .Returns(() => new Employee() {Id = personSeenViewModel.Id.Value});

            _checklistRepository
               .Setup(x => x.GetById(viewModel.Id))
               .Returns(new Checklist { Id = viewModel.Id, Status = Checklist.STATUS_DRAFT });

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.MainPersonSeen.Id, Is.EqualTo(personSeenViewModel.Id));
            Assert.That(savedChecklist.MainPersonSeenName, Is.EqualTo("Boros Blunt"));

        }

        [Test]
        public void Given_employee_is_a_persons_seen_WHEN_PostChecklist_then_employee_added_to_persons_seen_list()
        {
            //GIVEN
            var employee = new Employee() {Id = Guid.NewGuid(), Forename = "Ser Lorus", Surname = "Tyrell"};
            var personsSeenViewModel = new PersonsSeenViewModel() { Id = Guid.NewGuid(), EmployeeId = employee.Id, EmailAddress = employee.GetEmail(), FullName = employee.FullName };
            
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_DRAFT;
            viewModel.PersonsSeen.Add(personsSeenViewModel);

            _employeeRespository
                .Setup(x => x.GetById(personsSeenViewModel.EmployeeId.Value))
                .Returns(() => new Employee() { Id = personsSeenViewModel.EmployeeId.Value, Forename = "Ser Lorus", Surname = "Tyrell"});

            _checklistRepository
               .Setup(x => x.GetById(viewModel.Id))
               .Returns(() => new Checklist { Id = viewModel.Id, Status = Checklist.STATUS_DRAFT });

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget(); 
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());
            
            //WHEN
            controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.PersonsSeen.Count, Is.EqualTo(1));
            Assert.That(savedChecklist.PersonsSeen[0].Employee.Id, Is.EqualTo(personsSeenViewModel.EmployeeId));
            Assert.That(savedChecklist.PersonsSeen[0].FullName, Is.EqualTo(personsSeenViewModel.FullName));
            Assert.That(savedChecklist.PersonsSeen[0].EmailAddress, Is.EqualTo(personsSeenViewModel.EmailAddress));
        }

        [Test]
        public void Given_a_non_employee_is_a_persons_seen_WHEN_PostChecklist_then_added_to_persons_seen_list()
        {
            //GIVEN
            var personsSeenViewModel = new PersonsSeenViewModel() { Id = Guid.NewGuid(), EmployeeId = Guid.Empty, EmailAddress = "sl@highgarden.com", FullName = "Ser Lorus" };

            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_DRAFT;
            viewModel.PersonsSeen.Add(personsSeenViewModel);

            _checklistRepository
               .Setup(x => x.GetById(viewModel.Id))
               .Returns(new Checklist { Id = viewModel.Id, Status = Checklist.STATUS_DRAFT });

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.PersonsSeen.Count, Is.EqualTo(1));
            Assert.That(savedChecklist.PersonsSeen[0].Employee, Is.EqualTo(null));
            Assert.That(savedChecklist.PersonsSeen[0].FullName, Is.EqualTo(personsSeenViewModel.FullName));
            Assert.That(savedChecklist.PersonsSeen[0].EmailAddress, Is.EqualTo(personsSeenViewModel.EmailAddress));
        }

        [Test]
        public void Given_a_non_employee_is_a_persons_seen_and_is_being_updated_WHEN_PostChecklist_then_persons_seen_list_updated()
        {
            //GIVEN
            var personsSeenViewModel = new PersonsSeenViewModel() { Id = Guid.NewGuid(), EmployeeId = Guid.Empty, EmailAddress = "sl@highgarden.com", FullName = "Ser Lorus" };

            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_DRAFT;
            viewModel.PersonsSeen.Add(personsSeenViewModel);

            var checklist = new Checklist {Id = viewModel.Id, Status = Checklist.STATUS_DRAFT};
            checklist.AddPersonSeen(ChecklistPersonSeen.Create(personsSeenViewModel.Id, "old full name", "old email address"));

            _checklistRepository
               .Setup(x => x.GetById(viewModel.Id))
               .Returns(() => checklist);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.PersonsSeen.Count, Is.EqualTo(1));
            Assert.That(savedChecklist.PersonsSeen[0].Employee, Is.EqualTo(null));
            Assert.That(savedChecklist.PersonsSeen[0].Id, Is.EqualTo(personsSeenViewModel.Id));
            Assert.That(savedChecklist.PersonsSeen[0].FullName, Is.EqualTo(personsSeenViewModel.FullName));
            Assert.That(savedChecklist.PersonsSeen[0].EmailAddress, Is.EqualTo(personsSeenViewModel.EmailAddress));
        }

        [Test]
        public void Given_a_non_employee_is_a_persons_seen_and_is_removed_WHEN_PostChecklist_then_removed_from_persons_seen_list()
        {
            //GIVEN
            var nonEmployeeId = Guid.NewGuid();
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_DRAFT;
            viewModel.PersonsSeen.Add( new PersonsSeenViewModel() { Id = nonEmployeeId, EmployeeId = Guid.Empty, EmailAddress = "do not remove me email address", FullName = "do not remove me" });

            var checklist = new Checklist { Id = viewModel.Id, Status = Checklist.STATUS_DRAFT };
            checklist.AddPersonSeen(ChecklistPersonSeen.Create(nonEmployeeId, "do not remove me", "do not remove me email address"));
            checklist.AddPersonSeen(ChecklistPersonSeen.Create(Guid.NewGuid(), "old full name", "old email address"));

            _checklistRepository
               .Setup(x => x.GetById(viewModel.Id))
               .Returns(() => checklist);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            controller.PostChecklist(viewModel.Id, viewModel);
           
            //THEN
            Assert.That(savedChecklist.PersonsSeen.Count, Is.EqualTo(1));
            
        }

        [Test]
        public void Given_an_employee_is_a_persons_seen_and_is_removed_WHEN_PostChecklist_then_removed_from_persons_seen_list()
        {
            //GIVEN
            var employee1 = new Employee() { Id = Guid.Parse("11111111-ef43-4bc6-87a6-8cf48f1fcae7"), Forename = "Ser Lorus", Surname = "Tyrell"  };
            var employee2 = new Employee() { Id = Guid.Parse("22222222-ef43-4bc6-87a6-8cf48f1fcae7"), Forename = "Maid", Surname = "of Tarth" };

            var personsSeenViewModel = new PersonsSeenViewModel() { Id = Guid.NewGuid(), EmployeeId = employee2.Id, EmailAddress = employee2.GetEmail(), FullName = employee2.FullName };
            
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_DRAFT;
            viewModel.PersonsSeen.Add(personsSeenViewModel);

            var checklist = new Checklist { Id = viewModel.Id, Status = Checklist.STATUS_DRAFT };
            checklist.AddPersonSeen(ChecklistPersonSeen.Create(employee1));


            _employeeRespository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns<Guid>((id) => new Employee() {Id = id});

            _checklistRepository
               .Setup(x => x.GetById(viewModel.Id))
               .Returns(() => checklist);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());
            
            //WHEN
            controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.PersonsSeen.Count, Is.EqualTo(1));
        }

        [Test]
        public void Given_email_other_person_seen_when_submit_checklist_then_email_is_sent()
        {
            var otherEmailsViewModel = new OtherEmailsViewModel()
            {
                EmailAddress = "email1@email.com",
                Id = Guid.NewGuid(),
                Name = "Name1"
            };

            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.CoveringLetterContent = "covering letter content 1";
            viewModel.QAComments = "qa comments tests";
            viewModel.UpdatesRequired = false;
            viewModel.Submit = true;
            viewModel.EmailReportToOthers = true;
            viewModel.OtherEmails = new List<OtherEmailsViewModel>() { otherEmailsViewModel};
           
            _checklistRepository
                .Setup(x => x.GetById(viewModel.Id))
                .Returns(new Checklist { Id = Guid.NewGuid(), EmailReportToPerson = true });

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var result = controller.PostChecklist(viewModel.Id, viewModel);
            _bus.Verify(x => x.Send(It.IsAny<SendSubmitChecklistEmail>()), Times.Once);
            //THEN
            Assert.That(savedChecklist.OtherEmails[0].EmailAddress, Is.EqualTo(otherEmailsViewModel.EmailAddress));
            Assert.That(savedChecklist.OtherEmails[0].Name, Is.EqualTo(otherEmailsViewModel.Name));
        }

        [Test]
        public void Given_visit_date_is_a_UTC_date_in_GMT_When_PostChecklist_called_Then_local_visit_datetime_is_recorded()
        {
            //GIVEN
            var visitDate = new DateTime(2014, 3, 20, 0, 0, 0);

            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteVisit = new SiteVisitViewModel();
            viewModel.SiteVisit.VisitDate = visitDate.ToUniversalTime();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = "Draft";
            

            _checklistRepository
                .Setup(x => x.GetById(viewModel.Id))
                .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.VisitDate, Is.EqualTo(visitDate));
        }

        [Test]
        public void Given_visit_date_is_a_UTC_date_in_BST_When_PostChecklist_called_Then_local_visit_datetime_is_recorded()
        {
            //GIVEN
            var visitDate = new DateTime(2014, 4, 9, 0, 0, 0);
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteVisit = new SiteVisitViewModel();
            viewModel.SiteVisit.VisitDate = visitDate.ToUniversalTime();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = "Draft";


            _checklistRepository
                .Setup(x => x.GetById(viewModel.Id))
                .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.VisitDate, Is.EqualTo(visitDate));
        }

        [Test]
        public void Given_dates_are_UTC_dates_in_GMT_then_Dates_are_saved_as_local_datetime()
        {
            //given
            var gmtDate = new DateTime(2014, 3, 20, 0, 0, 0);
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteVisit = new SiteVisitViewModel();
            viewModel.SiteVisit.VisitDate = gmtDate.ToUniversalTime();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = "Submitted";
            viewModel.LastModifiedOn = gmtDate.ToUniversalTime();
            viewModel.CreatedOn = gmtDate.ToUniversalTime();
            viewModel.ExecutiveSummaryQASignedOffDate = gmtDate.ToUniversalTime();
            viewModel.CreatedOn = gmtDate.ToUniversalTime();


            _checklistRepository
                           .Setup(x => x.GetById(viewModel.Id))
                           .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.LastModifiedOn.Value, Is.EqualTo(gmtDate));
            Assert.That(savedChecklist.ExecutiveSummaryQACommentsSignedOffDate.Value, Is.EqualTo(gmtDate));

        }

        [Test]
        public void Given_dates_are_UTC_dates_in_BST_then_Dates_are_saved_as_local_datetime()
        {
            var id = Guid.NewGuid();
            var BSTDate = new DateTime(2014, 4, 6, 0, 0, 0);
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteVisit = new SiteVisitViewModel();
            viewModel.SiteVisit.VisitDate = BSTDate.ToUniversalTime();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = "Draft";
            viewModel.LastModifiedOn = BSTDate.ToUniversalTime();
            viewModel.CreatedOn = BSTDate.ToUniversalTime();
            viewModel.ExecutiveSummaryQASignedOffDate = BSTDate.ToUniversalTime();


            _checklistRepository
                           .Setup(x => x.GetById(viewModel.Id))
                           .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.LastModifiedOn.Value, Is.EqualTo(BSTDate));
           // Assert.That(savedChecklist.CreatedOn.Value, Is.EqualTo(BSTDate));
            Assert.That(savedChecklist.ExecutiveSummaryQACommentsSignedOffDate.Value, Is.EqualTo(BSTDate));
        }

        [Test]
        public void Given_completed_date_is_a_UTC_date_in_GMT_then_date_is_saved_as_local_datetime()
        {
            //given
            var gmtDate = new DateTime(2014, 3, 20, 0, 0, 0);
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteVisit = new SiteVisitViewModel();
            viewModel.SiteVisit.VisitDate = gmtDate.ToUniversalTime();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_COMPLETED;
            viewModel.CompletedOn = gmtDate.ToUniversalTime();

            _checklistRepository
                           .Setup(x => x.GetById(viewModel.Id))
                           .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.ChecklistCompletedOn.Value, Is.EqualTo(gmtDate));
        }

        [Test]
        public void Given_completed_date_is_a_UTC_date_in_BST_then_Dates_is_saved_as_local_datetime()
        {
            var id = Guid.NewGuid();
            var BSTDate = new DateTime(2014, 4, 6, 0, 0, 0);
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteVisit = new SiteVisitViewModel();
            viewModel.SiteVisit.VisitDate = BSTDate.ToUniversalTime();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_COMPLETED;
            viewModel.CompletedOn = BSTDate.ToUniversalTime();

            _checklistRepository
                           .Setup(x => x.GetById(viewModel.Id))
                           .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.ChecklistCompletedOn, Is.EqualTo(BSTDate));
            
        }

        [Test]
        public void Given_submitted_date_is_a_UTC_date_in_GMT_then_date_is_saved_as_local_datetime()
        {
            //given
            var gmtDate = new DateTime(2014, 3, 20, 0, 0, 0);
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteVisit = new SiteVisitViewModel();
            viewModel.SiteVisit.VisitDate = gmtDate.ToUniversalTime();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_SUBMITTED;
            viewModel.SubmittedOn = gmtDate.ToUniversalTime();
            viewModel.Submit = true;

            _checklistRepository
                           .Setup(x => x.GetById(viewModel.Id))
                           .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.ChecklistSubmittedOn, Is.EqualTo(gmtDate));
        }

        [Test]
        public void Given_submitted_date_is_a_UTC_date_in_BST_then_Dates_is_saved_as_local_datetime()
        {
            var id = Guid.NewGuid();
            var BSTDate = new DateTime(2014, 4, 6, 0, 0, 0);
            var viewModel = new ChecklistViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.SiteVisit = new SiteVisitViewModel();
            viewModel.SiteVisit.VisitDate = BSTDate.ToUniversalTime();
            viewModel.SiteId = 123;
            viewModel.ClientId = 7227;
            viewModel.Status = Checklist.STATUS_SUBMITTED;
            viewModel.SubmittedOn = BSTDate.ToUniversalTime();
            viewModel.Submit = true;

            _checklistRepository
                           .Setup(x => x.GetById(viewModel.Id))
                           .Returns(()=>(Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(viewModel.Id, viewModel);

            //THEN
            Assert.That(savedChecklist.ChecklistSubmittedOn, Is.EqualTo(BSTDate));

        }

        [Test]
        public void Given_documentation_date_is_GMT_then_date_saved_as_local_datetime()
        {
            //GIVEN
            var GMTDate = new DateTime(2014, 3, 20, 0, 0, 0);

            //Get view model
            var questions = GetListOfQuestions();

            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.SiteId = (int)_peninsulaSiteId;

            //Add new questions to API.
            var newQuestionAnswer = GetQuestionAnswerViewModel();
            checklistViewModel.Questions.Add(newQuestionAnswer);

            //Answer one of the questions.
            checklistViewModel.Questions[0].Answer = new AnswerViewModel();
            checklistViewModel.Questions[0].Answer.SupportingDocumentationDate = GMTDate.ToUniversalTime();
            checklistViewModel.Status = "Status 1";
            checklistViewModel.SiteId = 1;

            _checklistRepository
                .Setup(x => x.GetById(checklistViewModel.Id))
                .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);

            //THEN
            Assert.That(savedChecklist.Answers[0].SupportingDocumentationDate, Is.EqualTo(GMTDate));
        }


        [Test]
        public void Given_documentation_date_is_BST_then_date_saved_as_local_datetime()
        {
            //GIVEN
            var BSTDate = new DateTime(2014, 4, 20, 0, 0, 0);

            //Get view model
            var questions = GetListOfQuestions();

            var checklistViewModel = GetChecklistViewModelFromQuestions(questions);
            checklistViewModel.SiteId = (int)_peninsulaSiteId;

            //Add new questions to API.
            var newQuestionAnswer = GetQuestionAnswerViewModel();
            checklistViewModel.Questions.Add(newQuestionAnswer);

            //Answer one of the questions.
            checklistViewModel.Questions[0].Answer = new AnswerViewModel();
            checklistViewModel.Questions[0].Answer.SupportingDocumentationDate = BSTDate.ToUniversalTime();
            checklistViewModel.Status = "Status 1";
            checklistViewModel.SiteId = 1;

            _checklistRepository
                .Setup(x => x.GetById(checklistViewModel.Id))
                .Returns((Checklist)null);

            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            controller.Request = new HttpRequestMessage();
            controller.Request.Properties.Add(HttpPropertyKeys.HttpConfigurationKey, new HttpConfiguration());

            //WHEN
            var response = controller.PostChecklist(checklistViewModel.Id, checklistViewModel);

            //THEN
            Assert.That(savedChecklist.Answers[0].SupportingDocumentationDate, Is.EqualTo(BSTDate));
        }

        public ChecklistController GetTarget()
        {
            var controller = new ChecklistController(_dependencyFactory.Object);
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}