
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Runtime.CompilerServices;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NUnit.Framework;
using IQuestionRepository = BusinessSafe.Domain.RepositoryContracts.SafeCheck.IQuestionRepository;
using Question = BusinessSafe.Domain.Entities.SafeCheck.Question;


namespace EvaluationChecklist.Api.Tests.IndustryControllerTests
{
   
    [TestFixture]
    public class PostQuestionTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IChecklistTemplateRepository> _industryRepository;
        private Mock<IQuestionRepository> _questionRepository;
        private Mock<IChecklistTemplateQuestionRepository> _ChecklistTemplateQuestionRepository;       
        private Mock<IUserForAuditingRepository> _userForAuditing;

        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();

            _industryRepository = new Mock<IChecklistTemplateRepository>();
            _questionRepository = new Mock<IQuestionRepository>();
            _ChecklistTemplateQuestionRepository = new Mock<IChecklistTemplateQuestionRepository>();
            _userForAuditing = new Mock<IUserForAuditingRepository>();
                
            _dependencyFactory
                .Setup(c => c.GetInstance<IChecklistTemplateRepository>())
                .Returns(_industryRepository.Object);

            _dependencyFactory
               .Setup(c => c.GetInstance<IQuestionRepository>())
               .Returns(_questionRepository.Object);

            _dependencyFactory
                .Setup(c => c.GetInstance<IChecklistTemplateQuestionRepository>())
                .Returns(_ChecklistTemplateQuestionRepository.Object);

            _dependencyFactory
              .Setup(x => x.GetInstance<IUserForAuditingRepository>())
              .Returns(_userForAuditing.Object);

            UserForAuditing _user = new UserForAuditing() { Id = Guid.NewGuid(), CompanyId = 1 };

            _userForAuditing.Setup(x => x.GetSystemUser()).Returns(_user);

        }

        private Question GetQuestion()
        {
            var question = new Question();
            var category = new Category() { Id = Guid.NewGuid(), Title = "New Category", ReportTitle = "NewCat" };

            question.Id = Guid.NewGuid();
            question.Title = "Question 1";
            question.PossibleResponses = new List<QuestionResponse>();
            question.Category = category;


            question.PossibleResponses.Add(
                    new QuestionResponse
                    {
                        Id = Guid.NewGuid(),
                        Title = "Response 1",
                        GuidanceNotes = "Guidance Notes 1",
                        ActionRequired = "Action Required 1",
                        Date = new DateTime(2010, 10, 1),
                        ResponseType = "Negative",
                        SupportingEvidence = "Supporting Evidence 1"

                    });

            question.PossibleResponses.Add(
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

            question.PossibleResponses.Add(
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

            //question.Category = 

            return question;
        }

        [Test]
        public void Given_question_details_and_existing_industry_When_post_question_is_called_then_question_is_added_to_industry()
        {          
            var industry1 = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1" };
            var industry2 = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 2" };
            var industry3 = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 3" };

            _industryRepository
                  .Setup(x => x.GetById(industry1.Id))
                  .Returns(() => industry1);

            _industryRepository
                  .Setup(x => x.GetById(industry2.Id))
                  .Returns(() => industry2);

            _industryRepository
                  .Setup(x => x.GetById(industry3.Id))
                  .Returns(() => industry3);

            var returnedIndustries = new List<ChecklistTemplateQuestion>();

            Question q = new Question() { Title = "Q1" };

            ChecklistTemplateQuestion iq1 = new ChecklistTemplateQuestion() {Id = Guid.NewGuid(), Question = q, ChecklistTemplate = industry1};
            ChecklistTemplateQuestion iq2 = new ChecklistTemplateQuestion() {Id = Guid.NewGuid(), Question = q, ChecklistTemplate = industry3};
            returnedIndustries.Add( iq1 );
            returnedIndustries.Add( iq2 );


            _ChecklistTemplateQuestionRepository
                .Setup(x => x.GetByQuestion(It.IsAny<Guid>()))
                .Returns(returnedIndustries);


            ChecklistTemplateQuestion indQuest1 = null;
            ChecklistTemplateQuestion indQuest2 = null;
            _ChecklistTemplateQuestionRepository
                .Setup(x => x.SaveOrUpdate( iq1))
                .Callback(
                    delegate(ChecklistTemplateQuestion x)
                    {
                        indQuest1 = x;
                    }
                );

            _ChecklistTemplateQuestionRepository
                .Setup(x => x.SaveOrUpdate(iq2))
                .Callback(
                    delegate(ChecklistTemplateQuestion x)
                    {
                        indQuest2 = x;
                    }
                );

            _questionRepository
               .Setup(x => x.GetById(It.IsAny<Guid>()))
               .Returns(q);


            var industryModel = new IndustryQuestionModel();
            industryModel.QuestionId = q.Id;
            industryModel.IndustryIds = new List<Guid>();
            industryModel.IndustryIds.Add( industry2.Id);            
            
            var controller = GetTarget();
            controller.UpdateIndustryQuestions(industryModel);


            Assert.IsTrue(indQuest1.Deleted);
            Assert.IsTrue(indQuest2.Deleted);

            _ChecklistTemplateQuestionRepository.Verify(x => x.SaveOrUpdate(iq1), Times.Once);
            _ChecklistTemplateQuestionRepository.Verify(x => x.SaveOrUpdate(iq2), Times.Once);


        }

        [Test]
        public void Given_question_When_get_question_industries_is_called_Then_List_industries_containing_the_question_is_returned()
        {
            var questionList = new List<Question>();

            var industry1 = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1"};
            var industry2 = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 2" };
            var industry3 = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 3" };


            var returnedIndustries = new List<ChecklistTemplateQuestion>();

            Question q = new Question() {Title = "Q1"};

            returnedIndustries.Add( new ChecklistTemplateQuestion() { Id = Guid.NewGuid(), Question = q, ChecklistTemplate = industry1 } );
            returnedIndustries.Add( new ChecklistTemplateQuestion() { Id = Guid.NewGuid(), Question = q, ChecklistTemplate = industry3 });


            _ChecklistTemplateQuestionRepository
                .Setup(x => x.GetByQuestion(It.IsAny<Guid>()))
                .Returns(returnedIndustries);
           
            //_ChecklistTemplateQuestionRepository
            //    .Setup(x => x.MarkForDelete(It.IsAny<Guid>()))
            //    .Returns(returnedIndustries);
           
           

            var controller = GetTarget();
            controller.GetIndustriesByQuestionId(Guid.NewGuid());

            Assert.That(returnedIndustries.Count, Is.EqualTo(2));
            Assert.That(returnedIndustries[0].Question.Title, Is.EqualTo("Q1"));
            Assert.That(returnedIndustries[1].Question.Title, Is.EqualTo("Q1"));

            Assert.That(returnedIndustries[0].ChecklistTemplate.Id, Is.EqualTo(industry1.Id));
            Assert.That(returnedIndustries[1].ChecklistTemplate.Id, Is.EqualTo(industry3.Id));                   
        }


        [Test]
        public void Given_industry_When_update_industry_is_called_Then_industry_values_are_updated()
        {
            var industry = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1", Draft = true};
            
            _industryRepository
                  .Setup(x => x.GetById(industry.Id))
                  .Returns(() => industry);


            ChecklistTemplate updatedTemplate = null;            
            _industryRepository
                .Setup(x => x.SaveOrUpdate( It.IsAny<ChecklistTemplate>()))
                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        updatedTemplate = x;
                    }
                );

            var controller = GetTarget();

            IndustryViewModel model = new IndustryViewModel()
                                          {
                                              Id = industry.Id,
                                              Draft = false,
                                              Title = "Updated Title"
                                          };

            controller.UpdateIndustry(model);

            Assert.That(updatedTemplate.Id, Is.EqualTo(model.Id));
            Assert.That(updatedTemplate.Name, Is.EqualTo(model.Title));
            Assert.That(updatedTemplate.Draft, Is.EqualTo(model.Draft));
        }

        [Test]
        public void Given_industry_template_is_set_to_deleted_do_not_return()
        {
            var industries = new List<ChecklistTemplate>()
            {
                new ChecklistTemplate()
                {
                    Id = Guid.NewGuid(),
                    Name = "ChecklistTemplate 1",
                    Draft = true,
                    Deleted = false,
                    TemplateType = ChecklistTemplateType.Industry
                },
                new ChecklistTemplate()
                {
                    Id = Guid.NewGuid(),
                    Name = "ChecklistTemplate 2",
                    Draft = true,
                    Deleted = true,
                    TemplateType = ChecklistTemplateType.Industry
                }
            };

            _industryRepository
                  .Setup(x => x.GetAll())
                  .Returns(() => industries);
            
            var controller = GetTarget();
            var result = controller.Get();

            Assert.That(result.Count, Is.EqualTo(1));
        }


        public IndustryController GetTarget()
        {
            var controller = new IndustryController(_dependencyFactory.Object);
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}
