using System;
using System.Net;
using System.Net.Http;
using System.Runtime.InteropServices;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NUnit.Framework;
using User = Peninsula.Security.ActiveDirectory.User;

namespace EvaluationChecklist.Api.Tests.ConsultantControllerTests
{
    [TestFixture]
    public  class PostConsultantsTests
    {
        private Mock<IConsultantRepository> _consultantRepository;
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IActiveDirectoryService> _activeDirectoryService;
        private Mock<IUserForAuditingRepository> _userForAuditingRepository;
        
        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();
            _consultantRepository = new Mock<IConsultantRepository>();
            _activeDirectoryService = new Mock<IActiveDirectoryService>();
            _userForAuditingRepository = new Mock<IUserForAuditingRepository>();

            _dependencyFactory.Setup(x => x.GetInstance<IConsultantRepository>())
                .Returns(_consultantRepository.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IActiveDirectoryService>())
                .Returns(_activeDirectoryService.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IUserForAuditingRepository>())
               .Returns(() => _userForAuditingRepository.Object);


            _userForAuditingRepository.Setup(x => x.GetSystemUser())
                .Returns(() => new UserForAuditing());
        }

        public ConsultantController GetTarget()
        {
            var target = new ConsultantController(_dependencyFactory.Object);
            target.Request = new HttpRequestMessage();
            return target;
        }

        [Test]
        public void Given_consultant_exists_when_Post_then_consultant_is_updated()
        {
            Consultant savedConsultant = null;

            // Given
            var consultant = new Consultant() { Id = Guid.NewGuid() };
            var model = new ConsultantViewModel() { Id = consultant.Id, Forename = "Stansa", Surname = "Stark", Blacklisted= true, Email="as@casterlyRock.com", QaAdvisorAssigned = Guid.NewGuid()};
            var target = GetTarget();

            _consultantRepository.Setup(x => x.GetById(consultant.Id))
                .Returns(() => consultant);

            _consultantRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Consultant>()))
                .Callback<Consultant>(x => savedConsultant = x);

            // When
            target.Post(model);

            // Then
            Assert.That(savedConsultant.Id, Is.EqualTo(model.Id));
            Assert.That(savedConsultant.Forename, Is.EqualTo(model.Forename));
            Assert.That(savedConsultant.Surname, Is.EqualTo(model.Surname));
            Assert.That(savedConsultant.Email, Is.EqualTo(model.Email));
            Assert.That(savedConsultant.QaAdvisorAssigned, Is.EqualTo(model.QaAdvisorAssigned));
            Assert.That(savedConsultant.PercentageOfChecklistsToSendToQualityControl, Is.EqualTo(100));
        }

        [Test]
        public void Given_username_doesnt_exist_when_Post_then_404_error_is_returned()
        {
            Consultant savedConsultant = null;

            // Given
            var model = new ConsultantViewModel() { Id = Guid.NewGuid(), Username = "Stans.Stark"};
            var target = GetTarget();

            _consultantRepository.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => null);

            _consultantRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Consultant>()))
                .Callback<Consultant>(x => savedConsultant = x);

            _activeDirectoryService.Setup(x => x.DoesUserExist(It.IsAny<string>()))
                .Returns(false);

            // When
           var result = target.Post(model);

            // Then
           Assert.That(result.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        }

        [Test]
        public void Given_username_exist_when_Post_then_consultant_saved()
        {
            Consultant savedConsultant = null;
            User adUser = new User(){EmailAddress = "this@that.com",Forename = "Casey", Surname = "Stone"};
            // Given
            var model = new ConsultantViewModel() { Id = Guid.NewGuid(), Username = "Alastair.Polden" };
            var target = GetTarget();

            _consultantRepository.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => null);

            _consultantRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Consultant>()))
                .Callback<Consultant>(x => savedConsultant = x);

            _activeDirectoryService.Setup(x => x.DoesUserExist(It.IsAny<string>()))
                .Returns(true);

            _activeDirectoryService.Setup(x => x.GetUser(It.IsAny<string>()))
              .Returns(() => adUser);

            // When

            var result = target.Put(model.Username);

            // Then
            Assert.That(savedConsultant.Id, Is.Not.EqualTo(Guid.Empty));
            Assert.That(savedConsultant.Forename, Is.EqualTo(adUser.Forename));
            Assert.That(savedConsultant.Surname, Is.EqualTo(adUser.Surname));
            Assert.That(savedConsultant.Email, Is.EqualTo(adUser.EmailAddress));
            Assert.That(savedConsultant.PercentageOfChecklistsToSendToQualityControl, Is.EqualTo(20));

        }

        [Test]
        public void Given_username_exist_and_consultant_record_is_deleted_when_Post_then_consultant_restored()
        {
            // Given
            Consultant savedConsultant = null;
            var adUser = new User() { EmailAddress = "this@that.com", Forename = "Casey", Surname = "Stone" };
            var consultant = new Consultant() {Id = Guid.Parse("744905F7-62DC-4113-BB45-644E58F02D6A"), Deleted = true, Email = "cs@test.com"};
            var model = new ConsultantViewModel() { Id = Guid.NewGuid(), Username = "Casey.Stone" };
            var target = GetTarget();

            _consultantRepository.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => null);

            _consultantRepository.Setup(x => x.GetByUsername(model.Username, true))
                .Returns(() => consultant);

            _consultantRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Consultant>()))
                .Callback<Consultant>(x => savedConsultant = x);

            _activeDirectoryService.Setup(x => x.DoesUserExist(It.IsAny<string>()))
                .Returns(true);

            _activeDirectoryService.Setup(x => x.GetUser(It.IsAny<string>()))
              .Returns(() => adUser);

            // When

            var result = target.Put(model.Username);

            // Then
            Assert.That(savedConsultant.Deleted, Is.False);
            Assert.That(savedConsultant.Email, Is.EqualTo(adUser.EmailAddress));
            Assert.That(savedConsultant.Id, Is.EqualTo(consultant.Id));
           


        }
    }
}
