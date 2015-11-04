using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using BusinessSafe.Domain.Common;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Mappers;
using Moq;
using NUnit.Framework;
using EvaluationChecklist.Models;

namespace EvaluationChecklist.Api.Tests.QuestionControllerTests
{
    [TestFixture]
    public class GetQuestionTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IQuestionRepository> _questionRepository;
        private Mock<IQuestionResponseRepository> _questionResponseRepository;
        private Mock<ICategoryRepository> _categoryRepository;
        private Mock<IRepository<ReportLetterStatementCategory, Guid>> _reportLetterStatementCategoryRepo;
        private Mock<IChecklistTemplateRepository> _industryRepository;

        private string _supportingEvidence = "Acceptable supporting evidence";
        private string _unacceptableActionRequired = "Action required text";
        private string _improvementActionRequired = "Action required text to improve";

        private ChecklistTemplate _industryA = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "Test Industry A" };
        private ChecklistTemplate _industryB = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "Test Industry B" };
        
        [SetUp]
        public void Setup()
        {
            _categoryRepository = new Mock<ICategoryRepository>();
            _dependencyFactory = new Mock<IDependencyFactory>();

            _questionRepository = new Mock<IQuestionRepository>();
            _questionResponseRepository = new Mock<IQuestionResponseRepository>();
            _reportLetterStatementCategoryRepo = new Mock<IRepository<ReportLetterStatementCategory, Guid>>();
            _industryRepository = new Mock<IChecklistTemplateRepository>();

            _reportLetterStatementCategoryRepo.Setup(x => x.GetAll())
                .Returns(() => new List<ReportLetterStatementCategory>());

            _dependencyFactory
               .Setup(x => x.GetInstance<IQuestionRepository>())
               .Returns(_questionRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQuestionResponseRepository>())
                .Returns(_questionResponseRepository.Object);

            _dependencyFactory.Setup(c => c.GetInstance<ICategoryRepository>()).
                Returns(_categoryRepository.Object);

            _dependencyFactory.Setup(c => c.GetInstance<IRepository<ReportLetterStatementCategory, Guid>>())
               .Returns(_reportLetterStatementCategoryRepo.Object);

            _dependencyFactory.Setup(c => c.GetInstance<IChecklistTemplateRepository>())
            .Returns(_industryRepository.Object);

        }

        private Question GetQuestion()
        {
            var question = new Question();
            var category = new Category() { Id = Guid.NewGuid(), Title = "New Category", ReportTitle = "NewCat" };

            question.Id = Guid.NewGuid();
            question.Title = "Question 1";
            question.PossibleResponses = new List<QuestionResponse>();
            question.Category = category;
            question.Mandatory = true;
            question.Deleted = true;

            question.PossibleResponses.Add(
                    new QuestionResponse
                    {
                        Id = Guid.NewGuid(),
                        Title = "Acceptable",
                        GuidanceNotes = null,
                        ResponseType = "Postive",
                        SupportingEvidence = _supportingEvidence

                    });

            question.PossibleResponses.Add(
                new QuestionResponse
                {
                    Id = Guid.NewGuid(),
                    Title = "Unacceptable",
                    GuidanceNotes = null,
                    ActionRequired = _unacceptableActionRequired,
                    ResponseType = "Negative",
                });

            question.PossibleResponses.Add(
                new QuestionResponse
                {
                    Id = Guid.NewGuid(),
                    Title = "Improvement Required",
                    GuidanceNotes = null,
                    ActionRequired = _improvementActionRequired,
                    Date = new DateTime(2010, 10, 3),
                    ResponseType = "Positive",
                    
                });

            question.PossibleResponses.Add(
               new QuestionResponse
               {
                   Id = Guid.NewGuid(), 
                   Title = "Not Applicable",
               });

            question.AddIndustry( _industryA, null);
            question.AddIndustry( _industryB, null);

            question.AreaOfNonCompliance = "Test rea of non-compliance";
            question.AreaOfNonComplianceHeading = new ReportLetterStatementCategory()
                                                      {Id = Guid.NewGuid(), Name = "Test Heading"};

            return question;
        }

        [Test]
        public void Given_Question_Then_Values_Maps_To_The_Add_Edit_View_Model_Correctly()
        {
            var guidanceNote = "1.2345";
            var question = GetQuestion();
            question.PossibleResponses[1].GuidanceNotes = guidanceNote;
            
            _questionRepository
                  .Setup(x => x.GetById(question.Id))
                  .Returns(() => question);

            var controller = GetTarget();
            var response = controller.Get(question.Id);

            Assert.That(response.Id, Is.EqualTo(question.Id));
            Assert.That(response.Text, Is.EqualTo(question.Title));
            Assert.That(response.Mandatory, Is.EqualTo(question.Mandatory));
            Assert.That(response.AcceptableEnabled, Is.True);
            Assert.That(response.UnacceptableEnabled, Is.True);
            Assert.That(response.ImprovementRequiredEnabled, Is.True);
            Assert.That(response.NotApplicableEnabled, Is.True);
            Assert.That(response.CategoryId, Is.EqualTo(question.Category.Id));
            Assert.That(response.GuidanceNotes, Is.EqualTo(guidanceNote));
            Assert.That(response.OrderNumber, Is.EqualTo(question.OrderNumber));
            Assert.That(response.Deleted, Is.EqualTo(question.Deleted));

            Assert.That(response.SupportingEvidence, Is.EqualTo(_supportingEvidence));
            Assert.That(response.ActionRequired, Is.EqualTo(_unacceptableActionRequired));
            Assert.That(response.ImprovementRequired, Is.EqualTo(_improvementActionRequired));

            Assert.That(response.Industries.IndustryIds.Count, Is.EqualTo(2));
            Assert.That(response.Industries.IndustryIds[0], Is.EqualTo(_industryA.Id));
            Assert.That(response.Industries.IndustryIds[1], Is.EqualTo(_industryB.Id));

            Assert.That(response.AreaOfNonCompliance, Is.EqualTo(question.AreaOfNonCompliance));
            Assert.That(response.AreaOfNonComplianceHeadingId, Is.EqualTo(question.AreaOfNonComplianceHeading.Id));            
        }

        [Test]
        public void Given_Question_does_not_have_guidanace_notes_specified_Then_guidanceNote_value_mapped_to_null()
        {
            var question = GetQuestion();
            question.PossibleResponses.ToList().ForEach(r => r.GuidanceNotes = null);

            _questionRepository
                  .Setup(x => x.GetById(question.Id))
                  .Returns(() => question);

            var controller = GetTarget();
            var response = controller.Get(question.Id);

            Assert.That(response.GuidanceNotes, Is.Null);
        }

        [Test]
        public void Given_Questions_Have_Order_Numbers_Then_Retrieve_Next_Available_Order_Number()
        {
            var questions = new List<Question>()
            {
                new Question {Id = new Guid(), OrderNumber = 2},
                new Question {Id = new Guid(), OrderNumber = 4},
                new Question {Id = new Guid(), OrderNumber = 1}, 
                new Question {Id = new Guid(), OrderNumber = 3} 
            };

           _questionRepository
                  .Setup(x => x.GetAllNonClientSpecific())
                  .Returns(questions);

            var controller = GetTarget();
            var response = controller.GetQuestionNextOrderNumber();

            Assert.That(response, Is.EqualTo(5));
        }

        public QuestionController GetTarget()
        {
            var controller = new QuestionController(_dependencyFactory.Object);
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}
