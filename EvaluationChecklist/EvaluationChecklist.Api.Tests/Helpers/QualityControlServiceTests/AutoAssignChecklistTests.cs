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
    public class AutoAssignChecklistTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IBus> _bus;
        private Mock<IClientDetailsService> _clientDetailsService;
        private Mock<IConsultantRepository> _consultantRepo;
        private Mock<IGetCompleteChecklistsQuery> _getCompletedChecklistQuery;
        private Mock<IRepository<LastQaAdvisorAssigned, int>> _lastQaAdvisorAssignedRepo;
        private Mock<IQaAdvisorRepository> _qaAdvisorRepo;

        private Consultant _consultant;
        private QaAdvisor _qaAdvisor;

        [SetUp]
        public void Setup()
        {
            _consultant = Consultant.Create("Tywin", "Lannister");
            _qaAdvisor = QaAdvisor.Create("Jon", "Stark", "jon.stark@kings.landing.com");
            _qaAdvisor.Id = Guid.NewGuid();

            _bus = new Mock<IBus>();
            _clientDetailsService = new Mock<IClientDetailsService>();
            _dependencyFactory = new Mock<IDependencyFactory>();
            _consultantRepo = new Mock<IConsultantRepository>();
            _lastQaAdvisorAssignedRepo = new Mock<IRepository<LastQaAdvisorAssigned, int>>();

            _qaAdvisorRepo = new Mock<IQaAdvisorRepository>();

            _consultantRepo.Setup(x=> x.GetByFullname(It.IsAny<string>()))
                .Returns(() => _consultant);

            _qaAdvisorRepo.Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(() => _qaAdvisor);

            _getCompletedChecklistQuery = new Mock<IGetCompleteChecklistsQuery>();

            _dependencyFactory.Setup(x => x.GetInstance<IBus>())
                .Returns(() => _bus.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IConsultantRepository>())
                .Returns(() => _consultantRepo.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IGetCompleteChecklistsQuery>())
                .Returns(() => _getCompletedChecklistQuery.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IRepository<LastQaAdvisorAssigned, int>>())
                .Returns(() => _lastQaAdvisorAssignedRepo.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IQaAdvisorRepository>())
                .Returns(() => _qaAdvisorRepo.Object);
        }

        [Test]
        public void Given_checklist_status_is_completed_and_consultant_blacklisted_and_no_QaAdvisor_to_assign_to_then_AutoAssignChecklist_set_status_to_completed()
        {
            //GIVEN
            _getCompletedChecklistQuery.Setup(x => x.Count(_consultant.FullName)).Returns(() => 0);
            _consultant.AddToBlacklist();
            var checklist = new Checklist() { Status= Checklist.STATUS_COMPLETED, QaAdvisor = null, ChecklistCreatedBy = "Tywin Lannister"};
            var target = GetTarget();

            //WHEN
             target.AutoAssignChecklist(checklist);

            //THEN
             Assert.That(checklist.Status, Is.EqualTo(Checklist.STATUS_COMPLETED));
             Assert.That(checklist.QaAdvisor, Is.Null);
        }

        [Test]
        public void Given_checklist_status_is_completed_and_consultant_blacklisted_and_QaAdvisor_is_assign_to_then_assign_correct_advisor_set_status_to_completed()
        {
            //GIVEN
            var qaAdvisorAssigned = Guid.NewGuid();
            _getCompletedChecklistQuery.Setup(x => x.Count(_consultant.FullName)).Returns(() => 0);
            _consultant.AddToBlacklist();
            _consultant.QaAdvisorAssigned = _qaAdvisor.Id;

            var checklist = new Checklist() { Status = Checklist.STATUS_COMPLETED, QaAdvisor = null, ChecklistCreatedBy = "Tywin Lannister",
                                              ChecklistSubmittedBy = "Tywin Lannister"};
            var target = GetTarget();

            //WHEN
            target.AutoAssignChecklist(checklist);

            //THEN
            //Assert.That(checklist.Status, Is.EqualTo(Checklist.STATUS_COMPLETED));
            Assert.That(checklist.QaAdvisor.Id, Is.EqualTo(_qaAdvisor.Id));
        }

        [Test]
        public void Given_checklist_status_is_submitted_when_calling_AssignChecklistToQaAdvisor_then_assign_will_fail()
        {
            //GIVEN
            var qaAdvisorAssigned = Guid.NewGuid();
            
            var checklist = new Checklist()
            {
                Status = Checklist.STATUS_SUBMITTED                            
            };

            var target = GetTarget();

            //WHEN
            target.AssignChecklistToQaAdvisor(checklist, _qaAdvisor);

            //THEN            
            Assert.That(checklist.Status, Is.EqualTo(Checklist.STATUS_SUBMITTED));
        }


        public QualityControlService GetTarget()
        {
            return new QualityControlService(_dependencyFactory.Object);

        }
    }
}
