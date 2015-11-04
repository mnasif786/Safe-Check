using System;
using System.Collections.Generic;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using Moq;
using NUnit.Framework;

namespace EvaluationChecklist.Api.Tests.ConsultantControllerTests
{
    [TestFixture]
    internal class GetConsultantTests
    {
        private Mock<IConsultantRepository> _consultantRepository;
        private Mock<IDependencyFactory> _dependencyFactory;

        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();
            _consultantRepository = new Mock<IConsultantRepository>();

            _dependencyFactory.Setup(x => x.GetInstance<IConsultantRepository>())
             .Returns(_consultantRepository.Object);
        }

        [Test]
        public void Given_consultants_when_Get_then_returns_the_correct_view_model()
        {
            // Given
            var consultant = new Consultant() { Id = Guid.NewGuid(), Forename = "Ayra", Surname = "Stark", Deleted = false,
                Email = "as@email.winterfell", PercentageOfChecklistsToSendToQualityControl = 100, QaAdvisorAssigned = Guid.NewGuid() };
            _consultantRepository
                .Setup(x => x.GetAll())
                .Returns(() => new List<Consultant>() { consultant });

            var target = new ConsultantController(_dependencyFactory.Object);

            // When
            var result = target.Get();

            // Then
            Assert.That(result[0].Id, Is.EqualTo(consultant.Id));
            Assert.That(result[0].Forename, Is.EqualTo(consultant.Forename));
            Assert.That(result[0].Surname, Is.EqualTo(consultant.Surname));
            Assert.That(result[0].Fullname , Is.EqualTo(consultant.FullName));
            Assert.That(result[0].Email , Is.EqualTo(consultant.Email));
            Assert.That(result[0].QaAdvisorAssigned, Is.EqualTo(consultant.QaAdvisorAssigned));
            Assert.That(result[0].Blacklisted, Is.True);
        }

    }
}
