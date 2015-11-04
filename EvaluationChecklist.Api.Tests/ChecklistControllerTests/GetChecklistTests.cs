using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Threading;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.InfrastructureContracts.Logging;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NUnit.Framework;
using Checklist = BusinessSafe.Domain.Entities.SafeCheck.Checklist;
using Question = BusinessSafe.Domain.Entities.SafeCheck.Question;
using BusinessSafe.Application.RestAPI.Responses;

namespace EvaluationChecklist.Api.Tests.ChecklistControllerTests
{
    [TestFixture]
    public class GetChecklistTests
    {

        private Mock<ICheckListRepository> checklistRepo;
        private Mock<IChecklistTemplateRepository> industryRepo;
        private Mock<IDependencyFactory> dependencyFactory;
        private Mock<IPeninsulaLog> _log;
        private Mock<IUserIdentityFactory> _userIdentityFactory;
        private Mock<IQualityControlService> _qualityControlService;
        private Mock<IFavouriteChecklistRepository> _favouriteChecklistRepository;

        [SetUp]
        public  void Setup()
        {
            checklistRepo = new Mock<ICheckListRepository>();
            industryRepo = new Mock<IChecklistTemplateRepository>();
            _log = new Mock<IPeninsulaLog>();
            _userIdentityFactory = new Mock<IUserIdentityFactory>();
            _qualityControlService = new Mock<IQualityControlService>();
            _favouriteChecklistRepository = new Mock<IFavouriteChecklistRepository>();

            dependencyFactory = new Mock<IDependencyFactory>();
            dependencyFactory.Setup(x => x.GetInstance<ICheckListRepository>())
                .Returns(checklistRepo.Object);

            dependencyFactory.Setup(x => x.GetInstance<IChecklistTemplateRepository>())
               .Returns(industryRepo.Object);

            dependencyFactory.Setup(x => x.GetInstance<IPeninsulaLog>())
                .Returns(_log.Object);

            dependencyFactory
               .Setup(x => x.GetInstance<IUserIdentityFactory>())
               .Returns(_userIdentityFactory.Object);

            dependencyFactory
                .Setup(x => x.GetInstance<IQualityControlService>())
                .Returns(() => new QualityControlService(dependencyFactory.Object));

            dependencyFactory
                .Setup(x => x.GetInstance<IFavouriteChecklistRepository>())
                .Returns(_favouriteChecklistRepository.Object);

            var identity = new Mock<IIdentity>();
            dependencyFactory.Setup(x => x.GetInstance<IIdentity>())
                .Returns(identity.Object);
            identity.Setup(x => x.Name).Returns("domain\\abc.xyz");

            var principal = new Mock<IPrincipal>();
            principal.Setup(x => x.Identity).Returns(identity.Object);

            Thread.CurrentPrincipal = principal.Object;

            _userIdentityFactory.Setup(x => x.GetUserIdentity(It.IsAny<IPrincipal>())).Returns(new UserIdentity(Thread.CurrentPrincipal));
            
        }

        [Test]
        public void Given_a_checklist_then_the_values_are_correctly_mapped_to_the_view_model()
        {
            //given
            var clientId = 12312312;
            var siteId = 142123124;
            var coveringLetterContent= "Read this letter";
            var id = Guid.NewGuid();
            var visitDate = DateTime.Now;
            var visitBy = "H&S";
            var visitType = "Principal";
            var personSeenName = "John";
            var areaVisited = "First Floor";
            var areaNotVisited = "Ground Floor";
            var emailAddress = "email@server.com";
            var impressionTypeId = Guid.NewGuid();
            
            var otherEmail = ChecklistOtherEmail.Create("email@email.com", "Name1");

            var checklist = new Checklist()
                                {
                                    ClientId = clientId,
                                    SiteId = siteId,
                                    CoveringLetterContent = coveringLetterContent,
                                    Id = id,
                                    VisitDate = visitDate,
                                    VisitBy = visitBy,
                                    VisitType = visitType,
                                    EmailAddress = emailAddress,
                                    MainPersonSeenName = personSeenName,
                                    AreasVisited = areaVisited,
                                    AreasNotVisited = areaNotVisited,
                                    ImpressionType = new ImpressionType() { Id = impressionTypeId },
                                    OtherEmails = new List<ChecklistOtherEmail>() { otherEmail }
                                };

            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] {Question.Create(Guid.NewGuid(), "Question One", category, false, new UserForAuditing())};

            //checklist.UpdateQuestions(questions, new UserForAuditing());
            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });      
            }
          
            checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);

            //when
            var target = new ChecklistController(dependencyFactory.Object);

            var result = target.GetChecklist(id);

            //THEN
            Assert.That(result.ClientId, Is.EqualTo(clientId));
            Assert.That(result.SiteId, Is.EqualTo(siteId));
            Assert.That(result.Site.Id, Is.EqualTo(siteId));
            Assert.That(result.CoveringLetterContent, Is.EqualTo(coveringLetterContent));
            Assert.That(result.SiteVisit.VisitBy, Is.EqualTo(visitBy));
            Assert.That(result.SiteVisit.VisitDate.Value.Date, Is.EqualTo(visitDate.Date));
            Assert.That(result.SiteVisit.VisitType, Is.EqualTo(visitType));
            Assert.That(result.SiteVisit.EmailAddress, Is.EqualTo(emailAddress));
            Assert.That(result.SiteVisit.AreasNotVisited, Is.EqualTo(areaNotVisited));
            Assert.That(result.SiteVisit.AreasVisited, Is.EqualTo(areaVisited));
            Assert.That(result.SiteVisit.PersonSeen.Name, Is.EqualTo(personSeenName));
            Assert.That(result.SiteVisit.SelectedImpressionType.Id, Is.EqualTo(impressionTypeId));
            Assert.That(result.OtherEmails[0].Name, Is.EqualTo(otherEmail.Name));
            Assert.That(result.OtherEmails[0].Id, Is.EqualTo(otherEmail.Id));
            Assert.That(result.OtherEmails[0].EmailAddress, Is.EqualTo(otherEmail.EmailAddress));
        }

        [Test]
        public void Given_a_checklist_then_the_questions_are_correctly_mapped_to_the_view_model()
        {
            //GIVEN
            var id = Guid.NewGuid();
            var checklist = new Checklist();
            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] { Question.Create(Guid.NewGuid(), "Question One", category, false, new UserForAuditing()) };

            //checklist.UpdateQuestions(questions, new UserForAuditing());
            checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = questions[0] });

            checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);

            //when
            var target = new ChecklistController(dependencyFactory.Object);

            var result = target.GetChecklist(id);

            //THEN
            Assert.That(result.Questions.First().Question.Id, Is.EqualTo(questions.First().Id));
            Assert.That(result.Questions.First().Question.Text, Is.EqualTo(questions.First().Title));
            Assert.That(result.Questions.First().Question.CategoryId, Is.EqualTo(questions.First().Category.Id));
            Assert.That(result.Questions.First().Question.Category.Id, Is.EqualTo(questions.First().Category.Id));
        }

        [Test]
        public void Given_a_checklist_then_the_answers_are_correctly_mapped_to_the_view_model()
        {
            //GIVEN
            var id = Guid.NewGuid();
            var checklist = new Checklist();
            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] { Question.Create(Guid.NewGuid(), "Question One", category, false, new UserForAuditing()) };
            var answer = ChecklistAnswer.Create(questions.First());
            answer.SupportingEvidence = "this is the answer comment";
            answer.ActionRequired = "this is the answer comment";
            answer.Timescale = new Timescale()
                                   {
                                       Id = 123,
                                       Name = "Fred Flintstone"
                                   };
            answer.Response = new QuestionResponse() {Id = Guid.NewGuid()};
            answer.QaSignedOffBy = "abc";
            answer.AreaOfNonCompliance = "You have 3 seconds to comply";
            answer.SupportingDocumentationDate = DateTime.Now.AddDays(15);
            answer.SupportingDocumentationStatus = "Verified";
            
            //checklist.UpdateQuestions(questions, new UserForAuditing());

            checklist.Questions.Add(new ChecklistQuestion{ Checklist = checklist, Question = questions[0]});
            checklist.Answers.Add(answer);

            checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);

            //when
            var target = new ChecklistController(dependencyFactory.Object);

            var result = target.GetChecklist(id);

            //THEN
            Assert.That(result.Questions.First().Answer.QuestionId, Is.EqualTo(answer.Question.Id));
            Assert.That(result.Questions.First().Answer.SupportingEvidence, Is.EqualTo(answer.SupportingEvidence));
            Assert.That(result.Questions.First().Answer.ActionRequired, Is.EqualTo(answer.ActionRequired));
            Assert.That(result.Questions.First().Answer.SelectedResponseId, Is.EqualTo(answer.Response.Id));

            Assert.That(result.Questions.First().Answer.GuidanceNotes, Is.EqualTo(answer.Response.GuidanceNotes));
            Assert.That(result.Questions.First().Answer.Timescale.Id, Is.EqualTo(answer.Timescale.Id));
            Assert.That(result.Questions.First().Answer.Timescale.Name, Is.EqualTo(answer.Timescale.Name));
            Assert.That(result.Questions.First().Answer.QaSignedOffBy, Is.EqualTo(answer.QaSignedOffBy));
            Assert.That(result.Questions.First().Answer.AreaOfNonCompliance, Is.EqualTo(answer.AreaOfNonCompliance));
            Assert.That(result.Questions.First().Answer.SupportingDocumentationStatus, Is.EqualTo(answer.SupportingDocumentationStatus));
            Assert.That(result.Questions.First().Answer.SupportingDocumentationDate, Is.EqualTo(answer.SupportingDocumentationDate.ToUniversalTime()));
        }

        [Test]
        public void Given_a_checklist_Where_assigned_to_and_employee_not_listed_are_both_null_then_assigned_to_should_be_returned_as_null()
        {
            //GIVEN
            var id = Guid.NewGuid();
            var checklist = new Checklist();
            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] { Question.Create(Guid.NewGuid(), "Question One", category, false, new UserForAuditing()) };
            var answer = ChecklistAnswer.Create(questions.First());

            answer.AssignedTo = null;
            answer.EmployeeNotListed = null;

            //checklist.UpdateQuestions(questions, new UserForAuditing());
            checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = questions[0] });
            checklist.Answers.Add(answer);

            checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);

            //when
            var target = new ChecklistController(dependencyFactory.Object);

            var result = target.GetChecklist(id);

            //THEN           
            Assert.That(result.Questions.First().Answer.AssignedTo, Is.EqualTo(null));
        }

        [Test]
        public void Given_a_checklist_Where_assigned_to_is_a_valid_guid_and_not_empty_guid_then_assigned_to_should_return_employee_details()
        {
            //GIVEN
            var id = Guid.NewGuid();
            var checklist = new Checklist();
            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] { Question.Create(Guid.NewGuid(), "Question One", category, false, new UserForAuditing()) };
            var answer = ChecklistAnswer.Create(questions.First());

            answer.AssignedTo = new Employee()
                                    {
                                        Id = Guid.NewGuid()
                                    };

            answer.EmployeeNotListed = null;

            //checklist.UpdateQuestions(questions, new UserForAuditing());
            checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = questions[0] });
          
            checklist.Answers.Add(answer);

            checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);

            //when
            var target = new ChecklistController(dependencyFactory.Object);

            var result = target.GetChecklist(id);

            //THEN           
            Assert.AreNotEqual(null, result.Questions.First().Answer.AssignedTo);
            Assert.AreEqual(answer.AssignedTo.Id, result.Questions.First().Answer.AssignedTo.Id);           
        }

        [Test]
        public void Given_a_checklist_Where_assigned_to_id_is_null_and_employee_notlisted_is_not_null_then_assigned_to_should_return_non_employee_name()
        {
            //GIVEN
            var id = Guid.NewGuid();
            var checklist = new Checklist();
            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] { Question.Create(Guid.NewGuid(), "Question One", category, false, new UserForAuditing()) };
            var answer = ChecklistAnswer.Create(questions.First());

            answer.AssignedTo = null;

            answer.EmployeeNotListed = "Benny Hill";

            //checklist.UpdateQuestions(questions, new UserForAuditing());
            checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = questions[0] });
            checklist.Answers.Add(answer);

            checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);

            //_favouriteChecklistRepository.Setup(x => x.Get(It.IsAny<Guid>(), It.IsAny<string>()))
            //     .Returns(FavouriteChecklist.Create(checklist, "User"));

            //when
            var target = new ChecklistController(dependencyFactory.Object);
            var result = target.GetChecklist(id);

            //THEN           
            Assert.AreNotEqual(null, result.Questions.First().Answer.AssignedTo);
            Assert.AreEqual(Guid.Empty, result.Questions.First().Answer.AssignedTo.Id);
            Assert.AreEqual(answer.EmployeeNotListed, result.Questions.First().Answer.AssignedTo.NonEmployeeName); 
        }

        [Test]
        public void Given_a_checklist_has_immediate_risk_notifications_attached_When_GetChecklist_called_Then_IRNs_are_returned()
        {
            var site = new SiteAddressResponse() { Id = 1212431241, SiteName = "the site name", Address1 = "Address1", Postcode = "the postcode", };

            var checklist1 = new Checklist();
            checklist1.Id = Guid.NewGuid();
            checklist1.ClientId = 2424;
            checklist1.SiteId = (int?)site.Id;
            var immediateRiskNotification1 = new ImmediateRiskNotification();
            immediateRiskNotification1.Id = Guid.NewGuid();
            immediateRiskNotification1.Reference = "Reference 1";
            immediateRiskNotification1.Title = "Title 1";
            immediateRiskNotification1.SignificantHazardIdentified = "Significant Hazard Identified 1";
            immediateRiskNotification1.RecommendedImmediateAction = "Recommended Imediate Action 1";
            checklist1.ImmediateRiskNotifications.Add(immediateRiskNotification1);
            var immediateRiskNotification2 = new ImmediateRiskNotification();
            immediateRiskNotification2.Id = Guid.NewGuid();
            immediateRiskNotification2.Reference = "Reference 2";
            immediateRiskNotification2.Title = "Title 2";
            immediateRiskNotification2.SignificantHazardIdentified = "Significant Hazard Identified 2";
            immediateRiskNotification2.RecommendedImmediateAction = "Recommended Imediate Action 2";
            checklist1.ImmediateRiskNotifications.Add(immediateRiskNotification2);

            checklist1.AddImmediateRiskNotification(immediateRiskNotification1);
            checklist1.AddImmediateRiskNotification(immediateRiskNotification2);

            checklistRepo
                .Setup(x => x.GetById(checklist1.Id))
                .Returns(checklist1);

            var target = new ChecklistController(dependencyFactory.Object);

            var result = target.GetChecklist(checklist1.Id);

            Assert.That(result.ImmediateRiskNotifications.Count, Is.EqualTo(2));
            Assert.That(result.ImmediateRiskNotifications[0].Id, Is.EqualTo(immediateRiskNotification1.Id));
            Assert.That(result.ImmediateRiskNotifications[0].Reference, Is.EqualTo(immediateRiskNotification1.Reference));
            Assert.That(result.ImmediateRiskNotifications[0].Title, Is.EqualTo(immediateRiskNotification1.Title));
            Assert.That(result.ImmediateRiskNotifications[0].SignificantHazard, Is.EqualTo(immediateRiskNotification1.SignificantHazardIdentified));
            Assert.That(result.ImmediateRiskNotifications[0].RecommendedImmediate, Is.EqualTo(immediateRiskNotification1.RecommendedImmediateAction));
            Assert.That(result.ImmediateRiskNotifications[1].Id, Is.EqualTo(immediateRiskNotification2.Id));
            Assert.That(result.ImmediateRiskNotifications[1].Reference, Is.EqualTo(immediateRiskNotification2.Reference));
            Assert.That(result.ImmediateRiskNotifications[1].Title, Is.EqualTo(immediateRiskNotification2.Title));
            Assert.That(result.ImmediateRiskNotifications[1].SignificantHazard, Is.EqualTo(immediateRiskNotification2.SignificantHazardIdentified));
            Assert.That(result.ImmediateRiskNotifications[1].RecommendedImmediate, Is.EqualTo(immediateRiskNotification2.RecommendedImmediateAction));
        }

         [Test]
        public void When_GetChecklist_is_called_With_Duplicate_Possible_Responses_For_Question_Database_Then_Only_Return_One_Instance_Of_Each()
         {
            //GIVEN
            var id = Guid.NewGuid();
            var questionId = Guid.NewGuid();
            var checklist = new Checklist();
            var possibleResponseId = Guid.NewGuid();

            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] { Question.Create(questionId, "Question One", category, false, new UserForAuditing()), Question.Create(questionId, "Question one", category, false, new UserForAuditing()) };
          
            var questionResponse1 = new QuestionResponse() {Id = possibleResponseId, Title = "Acceptable"};
            var questionResponse2 = new QuestionResponse() {Id = possibleResponseId, Title = "Acceptable"};

            questions.First().PossibleResponses.Add(questionResponse1);
            questions.First().PossibleResponses.Add(questionResponse2);
             
            var checklistQuestions = new ChecklistQuestion() { Id = questionId, Checklist = checklist, Question = questions.First() };
         
            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });
            }

            checklist.Questions.Add(checklistQuestions);
          
            checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);
             
            //when
            var target = new ChecklistController(dependencyFactory.Object);

            var result = target.GetChecklist(id);

            //THEN
            Assert.That(result.Questions.First().Question.PossibleResponses.Count, Is.EqualTo(1));
      }

         [Test]
         public void Given_a_checklist_with_an_employee_as_persons_seen_then_person_seen_model_is_correct()
         {
             //GIVEN
             var employee1 = new Employee() { Id = Guid.NewGuid(), Forename = "Ilyn", Surname = "Payne"};
             employee1.SetEmail("test@tester.com", null);
             var employee2 = new Employee() {Id = Guid.NewGuid() };
             
             var checklist = new Checklist() {Id = Guid.NewGuid()};
             checklist.AddPersonSeen(ChecklistPersonSeen.Create(employee1));
             checklist.AddPersonSeen(ChecklistPersonSeen.Create(employee2));
             
             checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                 .Returns(() => checklist);

             //when
             var target = new ChecklistController(dependencyFactory.Object);
             var result = target.GetChecklist(checklist.Id);

             //THEN           
            Assert.That(result.PersonsSeen.Count,Is.EqualTo(2));

            Assert.That(result.PersonsSeen[0].EmployeeId, Is.EqualTo(employee1.Id));
            Assert.That(result.PersonsSeen[0].FullName, Is.EqualTo(employee1.FullName));
            Assert.That(result.PersonsSeen[0].EmailAddress, Is.EqualTo(employee1.GetEmail()));

         }

         [Test]
         public void Given_a_checklist_with_an_non_employee_as_persons_seen_then_person_seen_model_is_correct()
         {
             //GIVEN
             var personSeen = ChecklistPersonSeen.Create(Guid.NewGuid(), "Prince of Dorne", "p@dorne.com");
             var checklist = new Checklist() { Id = Guid.NewGuid() };
             checklist.AddPersonSeen(personSeen);


             checklistRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                 .Returns(() => checklist);

             //when
             var target = new ChecklistController(dependencyFactory.Object);
             var result = target.GetChecklist(checklist.Id);

             //THEN           
             Assert.That(result.PersonsSeen.Count, Is.EqualTo(1));

             Assert.That(result.PersonsSeen[0].EmployeeId, Is.EqualTo(Guid.Empty));
             Assert.That(result.PersonsSeen[0].FullName, Is.EqualTo(personSeen.FullName));
             Assert.That(result.PersonsSeen[0].EmailAddress, Is.EqualTo(personSeen.EmailAddress));
         }

        [Test]
        public void Given_dates_are_GMT_datetimes_then_Dates_are_return_as_UTC()
        {
            //given
            var id = Guid.NewGuid();
            var visitDate = new DateTime(2014, 3, 20, 0, 0, 0);

            var checklist = new Checklist()
            {
                VisitDate = visitDate
            };

            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] {Question.Create(Guid.NewGuid(), "Question One", category, false, new UserForAuditing())};

            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion {Checklist = checklist, Question = question});
            }

            checklistRepo
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);

            
            var target = new ChecklistController(dependencyFactory.Object);

            //WHEN
            var result = target.GetChecklist(id);

            //THEN
            Assert.That(result.SiteVisit.VisitDate.Value, Is.EqualTo(visitDate.ToUniversalTime()));

        }

        [Test]
        public void Given_dates_are_BST_datetimes_then_Dates_are_return_as_UTC()
        {
            //given
            var id = Guid.NewGuid();
            var BSTDate = new DateTime(2014, 4, 20, 0, 0, 0);

            var checklist = new Checklist()
            {
                VisitDate = BSTDate,
                CreatedOn = BSTDate,
                ChecklistCreatedOn = BSTDate,
                LastModifiedOn = BSTDate,
                ChecklistCompletedOn = BSTDate,
                ChecklistSubmittedOn = BSTDate,
                QaAdvisorAssignedOn = BSTDate,
                ExecutiveSummaryQACommentsSignedOffDate = BSTDate,
                DeletedOn = BSTDate,
               
            };

            var category = Category.Create(Guid.NewGuid(), "Category A");
            var questions = new Question[] { Question.Create(Guid.NewGuid(), "Question One", category, false, new UserForAuditing()) };

            foreach (var question in questions)
            {
                checklist.Questions.Add(new ChecklistQuestion { Checklist = checklist, Question = question });
            }

            checklistRepo
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(()=>checklist);


            var target = new ChecklistController(dependencyFactory.Object);

            //WHEN
            var result = target.GetChecklist(id);

            //THEN
            Assert.That(result.SiteVisit.VisitDate.Value, Is.EqualTo(BSTDate.ToUniversalTime()));
            Assert.That(result.LastModifiedOn.Value, Is.EqualTo(BSTDate.ToUniversalTime()));
            Assert.That(result.CreatedOn.Value, Is.EqualTo(BSTDate.ToUniversalTime()));
            Assert.That(result.CompletedOn.Value, Is.EqualTo(BSTDate.ToUniversalTime()));
            Assert.That(result.SubmittedOn.Value, Is.EqualTo(BSTDate.ToUniversalTime()));
            Assert.That(result.ExecutiveSummaryQASignedOffDate.Value, Is.EqualTo(BSTDate.ToUniversalTime()));
            
        }


        [Test]
        public void Given_checklist_is_deleted_return_deleted_status()
        {
            //given
            var id = Guid.NewGuid();
            var BSTDate = new DateTime(2014, 4, 20, 0, 0, 0);

            var checklist = new Checklist()
            {
                VisitDate = BSTDate,
                CreatedOn = BSTDate,
                ChecklistCreatedOn = BSTDate,
                LastModifiedOn = BSTDate,
                ChecklistCompletedOn = BSTDate,
                ChecklistSubmittedOn = BSTDate,
                QaAdvisorAssignedOn = BSTDate,
                ExecutiveSummaryQACommentsSignedOffDate = BSTDate,
                DeletedOn = BSTDate,
                Deleted = true
            };

            checklistRepo
              .Setup(x => x.GetById(It.IsAny<Guid>()))
              .Returns(() => checklist);
            
            var target = new ChecklistController(dependencyFactory.Object);

            //WHEN
            var result = target.GetChecklist(id);

            //THEN
            Assert.That(result.Deleted,Is.EqualTo(true));
        }
    }
}

