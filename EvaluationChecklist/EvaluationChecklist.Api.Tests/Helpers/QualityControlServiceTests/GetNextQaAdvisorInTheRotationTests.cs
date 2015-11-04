using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using EvaluationChecklist.Helpers;
using NUnit.Framework;
using Moq;
using NServiceBus;
using EvaluationChecklist.ClientDetails;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using BusinessSafe.Data.Queries.SafeCheck;
using BusinessSafe.Domain.Common;

namespace EvaluationChecklist.Api.Tests.Helpers.QualityControlServiceTests
{
    [TestFixture]
    public class GetLastQaAdvisorAssignedInTheRotationTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IBus> _bus;
        private Mock<IClientDetailsService> _clientDetailsService;
        private Mock<IConsultantRepository> _consultantRepo;
        private Mock<IGetChecklistsQuery> _getChecklistQuery;
        private Mock<IRepository<LastQaAdvisorAssigned, int>> _lastQaAdvisorAssignedRepo;
        private Mock<IQaAdvisorRepository> _qaAdvisorRepo;

        private Consultant _consultant;

        [SetUp]
        public void Setup()
        {
            _consultant = Consultant.Create("Tywin", "Lannister");

            _bus = new Mock<IBus>();
            _clientDetailsService = new Mock<IClientDetailsService>();
            _dependencyFactory = new Mock<IDependencyFactory>();
            _consultantRepo = new Mock<IConsultantRepository>();
            _lastQaAdvisorAssignedRepo = new Mock<IRepository<LastQaAdvisorAssigned, int>>();
            _qaAdvisorRepo = new Mock<IQaAdvisorRepository>();

            _consultantRepo.Setup(x => x.GetByFullname(It.IsAny<string>()))
                .Returns(() => _consultant);

            _getChecklistQuery = new Mock<IGetChecklistsQuery>();

            _dependencyFactory.Setup(x => x.GetInstance<IBus>())
                .Returns(() => _bus.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IConsultantRepository>())
               .Returns(() => _consultantRepo.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IGetChecklistsQuery>())
              .Returns(() => _getChecklistQuery.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IRepository<LastQaAdvisorAssigned, int>>())
              .Returns(() => _lastQaAdvisorAssignedRepo.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IQaAdvisorRepository>())
             .Returns(() => _qaAdvisorRepo.Object);
        }

        public QualityControlService GetTarget()
        {
            return new QualityControlService(_dependencyFactory.Object);
        }

        [Test]
        public void Given_that_the_next_qaAdvisor_is_NOT_set_when_GetNextQaAdvisorInTheRotation_then_returns_null()
        {
            var expectedAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "Alan", Surname = "Ball" };

            //GIVEN
            _lastQaAdvisorAssignedRepo.Setup(x => x.GetAll())
                .Returns(() => new List<LastQaAdvisorAssigned>());

            _lastQaAdvisorAssignedRepo.Setup(x => x.GetById(It.IsAny<int>()))
                .Returns(() => null);

            _qaAdvisorRepo.Setup(x => x.GetAll())
                .Returns(() => new List<QaAdvisor>() {
                    new QaAdvisor() { Forename="Sarah", Surname="Vaughan"}
                    ,expectedAdvisor}
                );

            var target = GetTarget();

            //WHEN
            var result = target.GetNextQaAdvisorInTheRotation();

            //THEN
            Assert.That(result, Is.Null);
            //Assert.That(result, Is.EqualTo(expectedAdvisor));
        }

        [Test]
        public void Given_that_the_last_qaAdvisor_is_set_when_GetNextQaAdvisorInTheRotation_then_returns_next_qaAdvisor()
        {
            var lastAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "Alan", Surname = "Ball", InRotation = true };
            var expectedAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "John", Surname = "Virgo", InRotation = true };

            //GIVEN
            _lastQaAdvisorAssignedRepo.Setup(x => x.GetAll())
                .Returns(() => new List<LastQaAdvisorAssigned>() { new LastQaAdvisorAssigned() { QaAdvisor = lastAdvisor } });

            _lastQaAdvisorAssignedRepo.Setup(x => x.GetById(It.IsAny<int>()))
               .Returns(() => new LastQaAdvisorAssigned { QaAdvisor = lastAdvisor });

            _qaAdvisorRepo.Setup(x => x.GetAll())
                .Returns(() => new List<QaAdvisor>() {
                    lastAdvisor
                    ,new QaAdvisor() { Id = Guid.NewGuid(),Forename="Sarah", Surname="Vaughan", InRotation = true }
                    ,expectedAdvisor}
                );

            var target = GetTarget();

            //WHEN
            var result = target.GetNextQaAdvisorInTheRotation();

            //THEN
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Forename, Is.EqualTo(expectedAdvisor.Forename));
            Assert.That(result, Is.EqualTo(expectedAdvisor));

        }

        [Test]
        public void Given_a_qaAdvisor_when_GetNextQaAdvisorInTheRotation_then_returns_next_qaAdvisor()
        {
            var qaAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "Alan", Surname = "Ball", InRotation = true };
            var expectedAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "John", Surname = "Virgo", InRotation = true };

            //GIVEN
            _lastQaAdvisorAssignedRepo.Setup(x => x.GetAll())
                .Returns(() => new List<LastQaAdvisorAssigned>() { new LastQaAdvisorAssigned() { QaAdvisor = qaAdvisor } });

            _lastQaAdvisorAssignedRepo.Setup(x => x.GetById(It.IsAny<int>()))
               .Returns(() => new LastQaAdvisorAssigned { QaAdvisor = qaAdvisor });

            _qaAdvisorRepo.Setup(x => x.GetAll())
                .Returns(() => new List<QaAdvisor>() {
                    new QaAdvisor() { Forename="Sarah", Surname="Vaughan", InRotation = true }
                    ,qaAdvisor
                    ,expectedAdvisor}
                );

            var target = GetTarget();

            //WHEN
            var result = target.GetNextQaAdvisorInTheRotation(qaAdvisor);

            //THEN
            Assert.That(result.Forename, Is.EqualTo(expectedAdvisor.Forename));
            Assert.That(result, Is.EqualTo(expectedAdvisor));
        }

        [Test]
        public void Given_the_last_qaAdvisor_in_the_list_when_GetNextQaAdvisorInTheRotation_then_returns_the_first_qaAdvisor()
        {
            var qaAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "John", Surname = "Virgo", InRotation = true };
            var expectedAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "Alan", Surname = "Ball", InRotation = true };
            

            //GIVEN
            _lastQaAdvisorAssignedRepo.Setup(x => x.GetAll())
                .Returns(() => new List<LastQaAdvisorAssigned>() { new LastQaAdvisorAssigned() { QaAdvisor = qaAdvisor } });

            _lastQaAdvisorAssignedRepo.Setup(x => x.GetById(It.IsAny<int>()))
               .Returns(() => new LastQaAdvisorAssigned { QaAdvisor = qaAdvisor });

            _qaAdvisorRepo.Setup(x => x.GetAll())
                .Returns(() => new List<QaAdvisor>() {
                    qaAdvisor
                    ,expectedAdvisor}
                );

            var target = GetTarget();

            //WHEN
            var result = target.GetNextQaAdvisorInTheRotation(qaAdvisor);

            //THEN
            Assert.That(result.Forename, Is.EqualTo(expectedAdvisor.Forename));
            Assert.That(result, Is.EqualTo(expectedAdvisor));
        }


        [Test]
        public void Given_a_qaAdvisor_when_GetNextQaAdvisorInTheRotation_then_returns_next_qaAdvisor_in_rotation()
        {
            var qaAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "Alan", Surname = "Ball", InRotation = true };
            var expectedAdvisor = new QaAdvisor() { Id = Guid.NewGuid(), Forename = "John", Surname = "Virgo", InRotation = true };

            //GIVEN
            _lastQaAdvisorAssignedRepo.Setup(x => x.GetAll())
                .Returns(() => new List<LastQaAdvisorAssigned>() { new LastQaAdvisorAssigned() { QaAdvisor = qaAdvisor } });

            _lastQaAdvisorAssignedRepo.Setup(x => x.GetById(It.IsAny<int>()))
               .Returns(() => new LastQaAdvisorAssigned { QaAdvisor = qaAdvisor });

            _qaAdvisorRepo.Setup(x => x.GetAll())
                .Returns(() => new List<QaAdvisor>() {
                    new QaAdvisor() { Forename="Bob", Surname="Smith", InRotation=false}
                    ,qaAdvisor
                    ,expectedAdvisor}
                );

            var target = GetTarget();

            //WHEN
            var result = target.GetNextQaAdvisorInTheRotation(qaAdvisor);

            //THEN
            Assert.That(result.Forename, Is.EqualTo(expectedAdvisor.Forename));
            Assert.That(result, Is.EqualTo(expectedAdvisor));
        }
    }
}
