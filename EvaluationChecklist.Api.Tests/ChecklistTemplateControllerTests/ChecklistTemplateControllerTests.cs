
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Runtime.Remoting.Messaging;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using EvaluationChecklist.Requests;
using Moq;
using NUnit.Framework;
using IQuestionRepository = BusinessSafe.Domain.RepositoryContracts.SafeCheck.IQuestionRepository;
using Question = BusinessSafe.Domain.Entities.SafeCheck.Question;


namespace EvaluationChecklist.Api.Tests.IndustryControllerTests
{
   
    [TestFixture]
    public class ChecklistTemplateControllerTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;

        private Mock<IChecklistTemplateRepository> _checklistTemplateRepository;
        private Mock<IQuestionRepository> _questionRepository;
        private Mock<IChecklistTemplateQuestionRepository> _checklistTemplateQuestionRepository;
        private Mock<IUserForAuditingRepository> _userForAuditing;
        
        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();

            _checklistTemplateRepository = new Mock<IChecklistTemplateRepository>();
            _questionRepository = new Mock<IQuestionRepository>();
            _checklistTemplateQuestionRepository = new Mock<IChecklistTemplateQuestionRepository>();
            _userForAuditing = new Mock<IUserForAuditingRepository>();
                
            _dependencyFactory
                .Setup(c => c.GetInstance<IChecklistTemplateRepository>())
                .Returns(_checklistTemplateRepository.Object);

            _dependencyFactory
               .Setup(c => c.GetInstance<IQuestionRepository>())
               .Returns(_questionRepository.Object);

            _dependencyFactory
                .Setup(c => c.GetInstance<IChecklistTemplateQuestionRepository>())
                .Returns(_checklistTemplateQuestionRepository.Object);

            _dependencyFactory
              .Setup(x => x.GetInstance<IUserForAuditingRepository>())
              .Returns(_userForAuditing.Object);

            UserForAuditing _user = new UserForAuditing() { Id = Guid.NewGuid(), CompanyId = 1 };

            _userForAuditing.Setup(x => x.GetSystemUser()).Returns(_user);

            _questionRepository.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns<Guid>(id => new Question() { Id = id });

        }

        [Test]
        public void Given_existing_template_when_clone_then_existing_template_is_retreived()
        {
            // given
            var id = Guid.NewGuid();
            var templateName = "Template 1";

            _checklistTemplateRepository
                .Setup(x => x.GetById(id))
                .Returns(new ChecklistTemplate{Id=id});

            // when
            var controller = GetTarget();
            controller.Clone(new CloneTemplateRequest { Id = id, TemplateType = 1, Name = templateName });

            //then
            _checklistTemplateRepository.Verify(x => x.GetById(It.Is<Guid>(t => t == id)), Times.Once);
        }

        [Test]
        public void Given_existing_template_when_clone_with_name_then_new_template_is_saved()
        {
            // given
            var existingTempate = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1" };
            var newTemplateName = "ChecklistTemplate 2";

            _checklistTemplateRepository
                .Setup(x => x.GetById(existingTempate.Id))
                .Returns(() => existingTempate);

            ChecklistTemplate template1 = null;

            _checklistTemplateRepository
                .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        template1 = x;
                    }
                );

            // when
            var controller = GetTarget();
            controller.Clone(new CloneTemplateRequest { Id = existingTempate.Id, TemplateType = 1, Name = newTemplateName });

            //then
            _checklistTemplateRepository.Verify(x => x.SaveOrUpdate(template1), Times.Once);
        }

        [Test]
        public void Given_existing_template_with_question_when_clone_with_name_then_new_template_contains_questions()
        {
            // given
            var existingTempate = new ChecklistTemplate()
            {
                Id = Guid.NewGuid(),
                Name = "ChecklistTemplate 1"
            };

            existingTempate.AddQuestion(new ChecklistTemplateQuestion {Question = new Question {Id = Guid.NewGuid()}}, null);
            existingTempate.AddQuestion(new ChecklistTemplateQuestion { Question = new Question { Id = Guid.NewGuid() } }, null);

            var newTemplateName = "ChecklistTemplate 2";

            _checklistTemplateRepository
                .Setup(x => x.GetById(existingTempate.Id))
                .Returns(() => existingTempate);

            ChecklistTemplate template1 = null;

            _checklistTemplateRepository
                .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        template1 = x;
                    }
                );

            // when
            var controller = GetTarget();
            controller.Clone(new CloneTemplateRequest
            {
                Id = existingTempate.Id,
                TemplateType = 2,
                Name = newTemplateName
            });

            //then
            Assert.That(template1.Questions.Count, Is.EqualTo(existingTempate.Questions.Count));
            Assert.That(template1.Questions[0].Question.Id, Is.EqualTo(existingTempate.Questions[0].Question.Id));
            Assert.That(template1.Questions[1].Question.Id, Is.EqualTo(existingTempate.Questions[1].Question.Id));
            Assert.That(template1.TemplateType, Is.EqualTo(ChecklistTemplateType.Bespoke));
        }

        [Test]
        public void Given_existing_template_with_question_when_exclude_question_then_template_does_not_contains_question()
        {
            // given
            var checklistTemplateId = Guid.NewGuid();
            var existingTemplate = new ChecklistTemplate()
            {
                Id = checklistTemplateId,
                Name = "ChecklistTemplate 1"
            };

            existingTemplate.AddQuestion(
                new ChecklistTemplateQuestion
                {
                    ChecklistTemplate = new ChecklistTemplate() {Id = checklistTemplateId},
                    Question = new Question {Id = Guid.NewGuid(), Deleted = false}
                }
                , null);


            
            _checklistTemplateRepository
              .Setup(x => x.GetById(existingTemplate.Id))
              .Returns(() => existingTemplate);

            ChecklistTemplate savedTemplate = null;

            _checklistTemplateRepository
                .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        savedTemplate = x;
                    }
                );

            // when
            var controller = GetTarget();
            controller.UpdateTemplateQuestion(new UpdateTemplateQuestionRequest()
            {
                TemplateId = existingTemplate.Id,
                QuestionId = existingTemplate.Questions[0].Question.Id,
                Exclude = true
            });

            //then
            Assert.That(savedTemplate.Questions.Count, Is.EqualTo(0));
        }

        [Test]
        public void Given_existing_template_when_include_new_question_then_template_contains_new_question()
        {
            // given
            var checklistTemplateId = Guid.NewGuid();
            var existingTemplate = new ChecklistTemplate()
            {
                Id = checklistTemplateId,
                Name = "ChecklistTemplate 1"
            };

            existingTemplate.AddQuestion(new ChecklistTemplateQuestion
            {
                ChecklistTemplate = new ChecklistTemplate() { Id = checklistTemplateId },
                Question = new Question { Id = Guid.NewGuid(), Deleted = false }
            },null);

            var newQuestion = new Question {Id = Guid.NewGuid()};
            _questionRepository
                .Setup(x => x.GetById(newQuestion.Id))
               .Returns(() => newQuestion);

            _checklistTemplateRepository
               .Setup(x => x.GetById(existingTemplate.Id))
               .Returns(() => existingTemplate);

            ChecklistTemplate template1 = null;

            _checklistTemplateRepository
                .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        template1 = x;
                    }
                );

            // when
            var controller = GetTarget();
            controller.UpdateTemplateQuestion(new UpdateTemplateQuestionRequest()
            {
                TemplateId = existingTemplate.Id,
                QuestionId = newQuestion.Id,
                Exclude = false
            });

            //then
            Assert.That(template1.Questions.Count, Is.EqualTo(existingTemplate.Questions.Count));
            Assert.That(template1.Questions[1].Question.Id, Is.EqualTo(newQuestion.Id));
            
        }

        [Test]
        public void Given_existing_template_with_same_name_when_clone_then_result_returns_forbidden()
        {
            // given
            var existingTempate = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1" };
            var newTemplateName = "ChecklistTemplate 2";

            _checklistTemplateRepository
                .Setup(x => x.GetById(existingTempate.Id))
                .Returns(() => existingTempate);

            _checklistTemplateRepository
                .Setup(x => x.DoesChecklistTemplateExistWithTheSameName(newTemplateName, existingTempate.Id)).Returns(
                    true);

            ChecklistTemplate template1 = null;

            _checklistTemplateRepository
                .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        template1 = x;
                    }
                );

            // when
            var controller = GetTarget();
            var result = controller.Clone(new CloneTemplateRequest { Id = existingTempate.Id,TemplateType = 1,Name = newTemplateName });

            //then
            Assert.That(result.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public void Given_existing_template_when_rename_then_existing_template_is_retreived()
        {
            // given
            var id = Guid.NewGuid();
            var templateName = "Template 1";

            _checklistTemplateRepository
                .Setup(x => x.GetById(id))
                .Returns(new ChecklistTemplate { Id = id });

            // when
            var controller = GetTarget();
            controller.Rename(new RenameTemplateRequest { Id = id, Name = templateName });

            //then
            _checklistTemplateRepository.Verify(x => x.GetById(It.Is<Guid>(t => t == id)), Times.Once);
        }

        [Test]
        public void Given_existing_template_when_rename_with_name_then_new_template_is_saved()
        {
            // given
            var existingTempate = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1" };
            var newTemplateName = "ChecklistTemplate 2";

            _checklistTemplateRepository
                .Setup(x => x.GetById(existingTempate.Id))
                .Returns(() => existingTempate);

            ChecklistTemplate template1 = null;

            _checklistTemplateRepository
                .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        template1 = x;
                    }
                );

            // when
            var controller = GetTarget();
            controller.Rename(new RenameTemplateRequest { Id = existingTempate.Id, Name = newTemplateName });

            //then
            _checklistTemplateRepository.Verify(x => x.SaveOrUpdate(template1), Times.Once);
        }

        [Test]
        public void Given_existing_template_when_rename_with_name_then_new_template_is_saved_with_new_name()
        {
            // given
            var existingTempate = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1" };
            var newTemplateName = "ChecklistTemplate 2";

            _checklistTemplateRepository
                .Setup(x => x.GetById(existingTempate.Id))
                .Returns(() => existingTempate);

            ChecklistTemplate template1 = null;

            _checklistTemplateRepository
                .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        template1 = x;
                    }
                );

            // when
            var controller = GetTarget();
            controller.Rename(new RenameTemplateRequest { Id = existingTempate.Id, Name = newTemplateName });

            //then
            _checklistTemplateRepository.Verify(x => x.SaveOrUpdate(It.Is<ChecklistTemplate>(r => r.Name == newTemplateName)));
        }

        [Test]
        public void Given_existing_template_with_same_name_when_rename_then_result_returns_forbidden()
        {
            // given
            var existingTempate = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1" };
            var newTemplateName = "ChecklistTemplate 2";

            _checklistTemplateRepository
                .Setup(x => x.GetById(existingTempate.Id))
                .Returns(() => existingTempate);

            _checklistTemplateRepository
                .Setup(x => x.DoesChecklistTemplateExistWithTheSameName(newTemplateName, existingTempate.Id)).Returns(
                    true);

            ChecklistTemplate template1 = null;

            _checklistTemplateRepository
                .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                                .Callback(
                    delegate(ChecklistTemplate x)
                    {
                        template1 = x;
                    }
                );

            // when
            var controller = GetTarget();
            var result = controller.Rename(new RenameTemplateRequest { Id = existingTempate.Id, Name = newTemplateName });

            //then
            Assert.That(result.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public void Given_no_template_with_entered_Id_then_throw_exception()
        {
            // given
            _checklistTemplateRepository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => null);

            // when
            var controller = GetTarget();
            var result = controller.DeleteTemplate(Guid.NewGuid());
            
            //then
            Assert.That(result.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        }

        [Test]
        public void Given_existing_template_set_to_deleted_then_deletes_variable_is_set()
        {
            // given
            var template = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1" };

            _checklistTemplateRepository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => template);

            _checklistTemplateRepository
               .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                               .Callback(
                   delegate(ChecklistTemplate x)
                   {
                       template = x;
                   }
               );

            // when
            var controller = GetTarget();
            var result = controller.DeleteTemplate(template.Id);
          
            //then
            Assert.That(result.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            _checklistTemplateRepository.Verify(x => x.SaveOrUpdate(It.Is<ChecklistTemplate>(r => r.Deleted == true)));
        }

        [Test]
        public void Given_template_had_question_when_adding_same_question_to_template_then_the_question_is_not_duplicated()
        {
            // given
            var questionId = Guid.NewGuid();
            var template = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1"  };
            template.Questions.Add(new ChecklistTemplateQuestion() {Question = new Question() { Id = questionId }});

            _checklistTemplateRepository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => template);

            _questionRepository.
               Setup(x => x.GetById(It.IsAny<Guid>()))
               .Returns<Guid>(id => new Question() { Id = id });

            ChecklistTemplate savedTemplate = null;
            _checklistTemplateRepository
               .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                               .Callback(
                   delegate(ChecklistTemplate x)
                   {
                       savedTemplate = x;
                   }
               );

            // when
            var controller = GetTarget();
            var result = controller.UpdateTemplateQuestion(new UpdateTemplateQuestionRequest() {Exclude = false,QuestionId = questionId, TemplateId = template.Id});

            //then
            Assert.That(result.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedTemplate.Questions.Count,Is.EqualTo(1));
        }

        [Test]
        public void Given_template_had_question_deleted_when_adding_same_question_to_template_then_the_question_is_restored()
        {
            // given
            var questionId = Guid.NewGuid();
            var template = new ChecklistTemplate() { Id = Guid.NewGuid(), Name = "ChecklistTemplate 1" };
            template.AddQuestion(new ChecklistTemplateQuestion() { Question = new Question() { Id = questionId }, Deleted = true}, null);

            _checklistTemplateRepository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => template);

            _questionRepository.
                Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns<Guid>(id => new Question() {Id = id});

            ChecklistTemplate savedTemplate = null;
            _checklistTemplateRepository
               .Setup(x => x.SaveOrUpdate(It.IsAny<ChecklistTemplate>()))
                               .Callback(
                   delegate(ChecklistTemplate x)
                   {
                       savedTemplate = x;
                   }
               );

            // when
            var controller = GetTarget();
            var result = controller.UpdateTemplateQuestion(new UpdateTemplateQuestionRequest() { Exclude = false, QuestionId = questionId, TemplateId = template.Id });

            //then
            Assert.That(result.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(savedTemplate.Questions.Count(x => !x.Deleted), Is.EqualTo(1));
            Assert.That(savedTemplate.Deleted,Is.EqualTo(false));
        }


        
        public ChecklistTemplateController GetTarget()
        {
            var controller = new ChecklistTemplateController(_dependencyFactory.Object);
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}
