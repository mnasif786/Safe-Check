using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Cache;
using System.Net.Http;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Common;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NUnit.Framework;
using IQuestionRepository = BusinessSafe.Domain.RepositoryContracts.SafeCheck.IQuestionRepository;
using System.Linq;


namespace EvaluationChecklist.Api.Tests.QuestionControllerTests
{
    [TestFixture]
    public class PostQuestionTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IQuestionRepository> _questionRepository;
        private Mock<IQuestionResponseRepository> _questionResponseRepository;
        private Mock<ICategoryRepository> _categoryRepository;
        private Mock<IUserForAuditingRepository> _userForAuditingRepository;
        private Mock<IChecklistTemplateRepository> _industryRepository;
        private Mock<IRepository<ReportLetterStatementCategory, Guid>> _reportLetterStatementCategoryRepo;
        
        [SetUp]
        public void Setup()
        {
            _categoryRepository = new Mock<ICategoryRepository>();
            _dependencyFactory = new Mock<IDependencyFactory>();
            _questionRepository = new Mock<IQuestionRepository>();
            _questionResponseRepository = new Mock<IQuestionResponseRepository>();
            _userForAuditingRepository = new Mock<IUserForAuditingRepository>();
            _industryRepository = new Mock<IChecklistTemplateRepository>();
            _reportLetterStatementCategoryRepo = new Mock<IRepository<ReportLetterStatementCategory, Guid>>();

            _industryRepository.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns<Guid>(id => new ChecklistTemplate() { Id = id });

            _reportLetterStatementCategoryRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
             .Returns<Guid>(id => new ReportLetterStatementCategory() { Id = id });

            _dependencyFactory
               .Setup(x => x.GetInstance<IQuestionRepository>())
               .Returns(_questionRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQuestionResponseRepository>())
                .Returns(_questionResponseRepository.Object);

            _dependencyFactory.Setup(c => c.GetInstance<ICategoryRepository>()).
                Returns(_categoryRepository.Object);

            _dependencyFactory.Setup(c => c.GetInstance<IUserForAuditingRepository>())
                .Returns(_userForAuditingRepository.Object);

            _dependencyFactory.Setup(c => c.GetInstance<IRepository<ReportLetterStatementCategory, Guid>>())
                .Returns(_reportLetterStatementCategoryRepo.Object);

            _dependencyFactory.Setup(c => c.GetInstance<IChecklistTemplateRepository>())
            .Returns(_industryRepository.Object);


        }

        private Question GetQuestion()
        {
            var question = new Question();
            var category = new Category() { Id = Guid.NewGuid(), Title = "New Category", ReportTitle = "NewCat"};

            question.Id = Guid.NewGuid();
            question.Title = "Question 1";            
            question.PossibleResponses = new List<QuestionResponse>();
            question.Category = category;
            
                    
            question.PossibleResponses.Add(
                    new QuestionResponse {
                        Id = Guid.NewGuid(), 
                        Title = Question.ACCEPTABLE_TITLE,
                        GuidanceNotes = "Guidance Notes 1",
                        ResponseType = "Postive",
                        SupportingEvidence = "Supporting Evidence 1"
                        
                    });

            question.PossibleResponses.Add(
                new QuestionResponse
                    {
                        Id = Guid.NewGuid(),
                        Title = Question.UNACCEPTABLE_TITLE,
                        GuidanceNotes = "Guidance Notes 1",
                        ActionRequired = "Action Required 2",
                        ResponseType = "Negative",
                    });

            question.PossibleResponses.Add(
                new QuestionResponse
                    {
                        Id = Guid.NewGuid(),
                        Title = Question.IMPROVEMENT_REQUIRED_TITLE,
                        GuidanceNotes = "Guidance Notes 1",
                        ActionRequired = "Action Required 3",
                        ResponseType = "Neutral",
                    });

            return question;
        }

        [Test]
        public void Given_question_details_When_post_question_is_called_then_question_details_are_updated()
        {
            var question = GetQuestion();

            _questionRepository
                .Setup(x => x.GetById(question.Id))
                .Returns(() => question);

            Question SavedQuestion = null;
            _questionRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Question>()))
                .Callback(
                    delegate(Question x)
                        {
                            SavedQuestion = x;
                        }
                );


            var viewModel = new AddEditQuestionViewModel();
            viewModel.Id = question.Id;
            viewModel.Text =  "Updated Text";;
            viewModel.CategoryId = Guid.NewGuid();
            viewModel.Mandatory = true;
            viewModel.Deleted = true;
            viewModel.AcceptableEnabled = true;
            viewModel.UnacceptableEnabled = true;
            viewModel.ImprovementRequiredEnabled = true;
            viewModel.NotApplicableEnabled = true;
            viewModel.GuidanceNotes = "1231243";
            viewModel.ActionRequired = "the new action required";
            viewModel.SupportingEvidence = "the new supporting evidence";
            viewModel.ImprovementRequired = "the new improvement required text";
            viewModel.OrderNumber = 131;
            viewModel.GuidanceNotes = "12.415.4";
            viewModel.AreaOfNonCompliance = "You have 20 seconds to comply";
            viewModel.AreaOfNonComplianceHeadingId = Guid.NewGuid();

            _categoryRepository
                .Setup(x => x.GetById(viewModel.CategoryId))
                .Returns(() => new Category() {Id = viewModel.CategoryId, Title = "abc"});

            var controller = GetTarget();
            var response = controller.PostQuestion(viewModel);

            Assert.That(response.StatusCode,Is.EqualTo(HttpStatusCode.OK));
            Assert.That(SavedQuestion.Title, Is.EqualTo(viewModel.Text));
            Assert.That(SavedQuestion.Category.Id, Is.EqualTo(viewModel.CategoryId));
            Assert.That(SavedQuestion.Mandatory, Is.EqualTo(viewModel.Mandatory));
            Assert.That(SavedQuestion.OrderNumber, Is.EqualTo(viewModel.OrderNumber));
            Assert.That(SavedQuestion.Deleted, Is.EqualTo(viewModel.Deleted));
            Assert.That(SavedQuestion.IsAcceptableAnswerEnabled, Is.EqualTo(viewModel.AcceptableEnabled));
            Assert.That(SavedQuestion.IsImprovementRequiredAnswerEnabled, Is.EqualTo(viewModel.ImprovementRequiredEnabled));
            Assert.That(SavedQuestion.IsUnacceptableAnswerEnabled, Is.EqualTo(viewModel.UnacceptableEnabled));
            Assert.That(SavedQuestion.IsNotApplicableAnswerEnabled, Is.EqualTo(viewModel.NotApplicableEnabled));
            Assert.That(SavedQuestion.SupportingEvidence, Is.EqualTo(viewModel.SupportingEvidence));
            Assert.That(SavedQuestion.ImprovementRequired, Is.EqualTo(viewModel.ImprovementRequired));
            Assert.That(SavedQuestion.ActionRequired, Is.EqualTo(viewModel.ActionRequired));
            Assert.That(SavedQuestion.GuidanceNotes,Is.EqualTo(viewModel.GuidanceNotes));
            Assert.That(SavedQuestion.AreaOfNonCompliance, Is.EqualTo(viewModel.AreaOfNonCompliance));
            Assert.That(SavedQuestion.AreaOfNonComplianceHeading, Is.Not.Null);
            Assert.That(SavedQuestion.AreaOfNonComplianceHeading.Id, Is.EqualTo(viewModel.AreaOfNonComplianceHeadingId));

        }

        [Test]
        public void Given_question_with_no_responses_When_post_question_is_called_then_responsedetails_added()
        {
            var question = GetQuestion();
            question.PossibleResponses.Clear();

            _questionRepository
                .Setup(x => x.GetById(question.Id))
                .Returns(() => question);


            Question SavedQuestion = null;
            _questionRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Question>()))
                .Callback(
                    delegate(Question x)
                        {
                            SavedQuestion = x;
                        }
                );


            var viewModel = new AddEditQuestionViewModel();
            viewModel.Id = question.Id;
            viewModel.Text = "Updated Text";
            viewModel.CategoryId = Guid.NewGuid();
            viewModel.Mandatory = true;
            viewModel.Deleted = true;
            viewModel.AcceptableEnabled = true;
            viewModel.UnacceptableEnabled = true;
            viewModel.ImprovementRequiredEnabled = true;
            viewModel.NotApplicableEnabled = true;
            viewModel.GuidanceNotes = "1231243";
            
            _categoryRepository
                .Setup(x => x.GetById(viewModel.CategoryId))
                .Returns(() => new Category() {Id = viewModel.CategoryId, Title = "abc"});

            _userForAuditingRepository
                .Setup(x => x.GetSystemUser())
                .Returns(new BusinessSafe.Domain.Entities.UserForAuditing {CompanyId = 1234L, Id = Guid.NewGuid()});
            
            var controller = GetTarget();
            var response = controller.PostQuestion(viewModel);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(SavedQuestion.IsAcceptableAnswerEnabled, Is.EqualTo(viewModel.AcceptableEnabled));
            Assert.That(SavedQuestion.IsImprovementRequiredAnswerEnabled, Is.EqualTo(viewModel.ImprovementRequiredEnabled));
            Assert.That(SavedQuestion.IsUnacceptableAnswerEnabled, Is.EqualTo(viewModel.UnacceptableEnabled));
            Assert.That(SavedQuestion.IsNotApplicableAnswerEnabled, Is.EqualTo(viewModel.NotApplicableEnabled));
        }

        [Test]
        public void Given_question_details_with_industries_When_post_question_is_called_then_industries_added()
        {
            var question = GetQuestion();

            _questionRepository
                .Setup(x => x.GetById(question.Id))
                .Returns(() => question);

            Question SavedQuestion = null;
            _questionRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Question>()))
                .Callback(
                    delegate(Question x)
                    {
                        SavedQuestion = x;
                    }
                );

            var viewModel = new AddEditQuestionViewModel();
            viewModel.Id = question.Id;
            viewModel.Text = "Updated Text"; ;
            viewModel.CategoryId = Guid.NewGuid();
            viewModel.Mandatory = true;
            viewModel.Deleted = true;
            viewModel.AcceptableEnabled = true;
            viewModel.UnacceptableEnabled = true;
            viewModel.ImprovementRequiredEnabled = true;
            viewModel.NotApplicableEnabled = true;
            viewModel.GuidanceNotes = "1231243";
            viewModel.ActionRequired = "the new action required";
            viewModel.SupportingEvidence = "the new supporting evidence";
            viewModel.ImprovementRequired = "the new improvement required text";
            viewModel.OrderNumber = 131;
            viewModel.GuidanceNotes = "12.415.4";
            viewModel.Industries.IndustryIds.Add(Guid.NewGuid());
            viewModel.Industries.IndustryIds.Add(Guid.NewGuid());
            viewModel.Industries.IndustryIds.Add(Guid.NewGuid());

            _categoryRepository
                .Setup(x => x.GetById(viewModel.CategoryId))
                .Returns(() => new Category() { Id = viewModel.CategoryId, Title = "abc" });

            var controller = GetTarget();
            var response = controller.PostQuestion(viewModel);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(SavedQuestion.Industries.Count,Is.EqualTo(3));

        }

        [Test]
        public void Given_question_details_with_industries_When_post_question_is_called_then_industries_removed()
        {
            List<ChecklistTemplate> industries = new List<ChecklistTemplate>();
            industries.Add( new ChecklistTemplate(){Id = Guid.NewGuid()});
            industries.Add( new ChecklistTemplate(){Id = Guid.NewGuid()});
            industries.Add( new ChecklistTemplate(){Id = Guid.NewGuid()});

            var question = GetQuestion();
            question.AddIndustry( industries[0], null);
            question.AddIndustry( industries[1], null);
            question.AddIndustry( industries[2], null);            

            _questionRepository
                .Setup(x => x.GetById(question.Id))
                .Returns(() => question);

            Question SavedQuestion = null;
            _questionRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Question>()))
                .Callback(
                    delegate(Question x)
                    {
                        SavedQuestion = x;
                    }
                );

            var viewModel = new AddEditQuestionViewModel();
            viewModel.Id = question.Id;
            viewModel.Text = "Updated Text"; ;
            viewModel.CategoryId = Guid.NewGuid();
            viewModel.Mandatory = true;
            viewModel.Deleted = true;
            viewModel.AcceptableEnabled = true;
            viewModel.UnacceptableEnabled = true;
            viewModel.ImprovementRequiredEnabled = true;
            viewModel.NotApplicableEnabled = true;
            viewModel.GuidanceNotes = "1231243";
            viewModel.ActionRequired = "the new action required";
            viewModel.SupportingEvidence = "the new supporting evidence";
            viewModel.ImprovementRequired = "the new improvement required text";
            viewModel.OrderNumber = 131;
            viewModel.GuidanceNotes = "12.415.4";

            viewModel.Industries.IndustryIds.Add(industries[0].Id);
            viewModel.Industries.IndustryIds.Add(industries[2].Id);
            
            _categoryRepository
                .Setup(x => x.GetById(viewModel.CategoryId))
                .Returns(() => new Category() { Id = viewModel.CategoryId, Title = "abc" });

            var controller = GetTarget();
            var response = controller.PostQuestion(viewModel);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(SavedQuestion.Industries.Count(x => !x.Deleted)  , Is.EqualTo(2));
            Assert.That(SavedQuestion.Industries.Count(x => x.Deleted), Is.EqualTo(1));

        }

        [Test]
        public void Given_new_question_details_When_post_question_is_called_then_question_is_created_with_correct_details()
        {
            Question question = null;

            _questionRepository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => question);

            Question SavedQuestion = null;
            _questionRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Question>()))
                .Callback(
                    delegate(Question x)
                    {
                        SavedQuestion = x;
                    }
                );


            var viewModel = new AddEditQuestionViewModel();
            viewModel.Id = Guid.NewGuid();
            viewModel.Text = "Updated Text"; ;
            viewModel.CategoryId = Guid.NewGuid();
            viewModel.Mandatory = true;
            viewModel.Deleted = true;
            viewModel.AcceptableEnabled = true;
            viewModel.UnacceptableEnabled = true;
            viewModel.ImprovementRequiredEnabled = true;
            viewModel.NotApplicableEnabled = true;
            viewModel.GuidanceNotes = "1231243";
            viewModel.ActionRequired = "the new action required";
            viewModel.SupportingEvidence = "the new supporting evidence";
            viewModel.ImprovementRequired = "the new improvement required text";
            viewModel.OrderNumber = 131;
            viewModel.GuidanceNotes = "12.415.4";

            _categoryRepository
                .Setup(x => x.GetById(viewModel.CategoryId))
                .Returns(() => new Category() { Id = viewModel.CategoryId, Title = "abc" });

            var controller = GetTarget();
            var response = controller.PostQuestion(viewModel);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(SavedQuestion.Title, Is.EqualTo(viewModel.Text));
            Assert.That(SavedQuestion.Category.Id, Is.EqualTo(viewModel.CategoryId));
            Assert.That(SavedQuestion.Mandatory, Is.EqualTo(viewModel.Mandatory));
            Assert.That(SavedQuestion.OrderNumber, Is.EqualTo(viewModel.OrderNumber));
            Assert.That(SavedQuestion.Deleted, Is.EqualTo(viewModel.Deleted));
            Assert.That(SavedQuestion.IsAcceptableAnswerEnabled, Is.EqualTo(viewModel.AcceptableEnabled));
            Assert.That(SavedQuestion.IsImprovementRequiredAnswerEnabled, Is.EqualTo(viewModel.ImprovementRequiredEnabled));
            Assert.That(SavedQuestion.IsUnacceptableAnswerEnabled, Is.EqualTo(viewModel.UnacceptableEnabled));
            Assert.That(SavedQuestion.IsNotApplicableAnswerEnabled, Is.EqualTo(viewModel.NotApplicableEnabled));
            Assert.That(SavedQuestion.SupportingEvidence, Is.EqualTo(viewModel.SupportingEvidence));
            Assert.That(SavedQuestion.ImprovementRequired, Is.EqualTo(viewModel.ImprovementRequired));
            Assert.That(SavedQuestion.ActionRequired, Is.EqualTo(viewModel.ActionRequired));
            Assert.That(SavedQuestion.GuidanceNotes, Is.EqualTo(viewModel.GuidanceNotes));
        }

        [Test]
        public void Given_new_question_order_details_When_post_order_questions_is_called_then_questions_are_given_correct_order()
        {
            var questionId1 = Guid.NewGuid();
            var questionId3 = Guid.NewGuid();
            
            var questions = new List<Question>()
            {
                new Question() {Id = questionId1, OrderNumber = 1},
                new Question() {Id = Guid.NewGuid(), OrderNumber = 4},
                new Question() {Id = questionId3, OrderNumber = 3},
            };

            _questionRepository
                .Setup(x => x.GetById(questionId1))
                .Returns(() => questions[0]);

            _questionRepository
                .Setup(x => x.GetAllNonClientSpecific())
                .Returns(questions);

            Question SavedQuestion = null;
            _questionRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Question>()))
                .Callback(
                    delegate(Question x)
                    {
                        SavedQuestion = x;
                    }
            );

            var request = new List<QuestionOrderViewModel>()
            {
                new QuestionOrderViewModel() {QuestionId = questionId1, OrderNumber = 2}
            };

            var controller = GetTarget();
            var response = controller.UpdateQuestionOrder(request);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(SavedQuestion.OrderNumber, Is.EqualTo(request[0].OrderNumber));
            Assert.That(SavedQuestion.Id, Is.EqualTo(request[0].QuestionId));
        }

        public QuestionController GetTarget()
        {
            var controller = new QuestionController( _dependencyFactory.Object );
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}
