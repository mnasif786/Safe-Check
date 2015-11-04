using System;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NUnit.Framework;

namespace EvaluationChecklist.Api.Tests.ConsultantControllerTests
{
    [TestFixture]
    public class DeleteConsultantsTests
    {
        private Mock<IConsultantRepository> _consultantRepository;
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IUserForAuditingRepository> _userForAuditingRepository;
        
        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();
            _consultantRepository = new Mock<IConsultantRepository>();
            _userForAuditingRepository = new Mock<IUserForAuditingRepository>();

            _dependencyFactory.Setup(x => x.GetInstance<IConsultantRepository>())
                .Returns(_consultantRepository.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IUserForAuditingRepository>())
                .Returns(_userForAuditingRepository.Object);

        }



        [Test]
        public void Given_consultant_exists_when_Delete_then_consultant_deleted()
        {
            Consultant savedConsultant = null;

            // Given
            var consultant = new Consultant() { Id = Guid.NewGuid() };
            var model = new ConsultantViewModel() { Id = consultant.Id, Forename = "Stansa", Surname = "Stark", Blacklisted= true, Email="as@casterlyRock.com", QaAdvisorAssigned = Guid.NewGuid()};
            var target = new ConsultantController(_dependencyFactory.Object);

            _consultantRepository.Setup(x => x.GetById(consultant.Id))
                .Returns(() => consultant);

            _consultantRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Consultant>()))
                .Callback<Consultant>(x => savedConsultant = x);

            // When
            target.Delete(consultant.Id);

            // Then
            Assert.That(savedConsultant.Id, Is.EqualTo(model.Id));
            Assert.That(savedConsultant.Deleted, Is.EqualTo(true));
        }
    }
}
