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

namespace EvaluationChecklist.Api.Tests.Helpers.QualityControlServiceTests
{
    [TestFixture]
    public class DoesChecklistNeedToBeCheckedTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IBus> _bus;
        private Mock<IClientDetailsService> _clientDetailsService;
        private Mock<IConsultantRepository> _consultantRepo;
        private Mock<IGetCompleteChecklistsQuery> _getCompletedChecklistQuery;

        private Consultant _consultant;

        [SetUp]
        public void Setup()
        {
            _consultant = Consultant.Create("Tywin", "Lannister");

            _bus = new Mock<IBus>();
            _clientDetailsService = new Mock<IClientDetailsService>();
            _dependencyFactory = new Mock<IDependencyFactory>();
            _consultantRepo = new Mock<IConsultantRepository>();
            _consultantRepo.Setup(x=> x.GetByFullname(It.IsAny<string>()))
                .Returns(() => _consultant);

            _getCompletedChecklistQuery = new Mock<IGetCompleteChecklistsQuery>();

            _dependencyFactory.Setup(x => x.GetInstance<IBus>())
                .Returns(() => _bus.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IConsultantRepository>())
               .Returns(() => _consultantRepo.Object);

            _dependencyFactory.Setup(x => x.GetInstance<IGetCompleteChecklistsQuery>())
              .Returns(() => _getCompletedChecklistQuery.Object);
        }

        [Test]
        public void Given_checklist_status_is_completed_and_consultant_blacklisted_then_DoesChecklistNeedToBeChecked_returns_true()
        {
            //GIVEN
            _getCompletedChecklistQuery.Setup(x => x.Count(_consultant.FullName))
              .Returns(() => 0);
            _consultant.AddToBlacklist();
            var checklist = new Checklist() { Status= Checklist.STATUS_COMPLETED, QaAdvisor = null, ChecklistCreatedBy = "Tywin Lannister"};
            var target = GetTarget();

            //WHEN
            var result = target.DoesChecklistNeedToBeChecked(checklist);

            //THEN
            Assert.That(result, Is.True);
        }

        [Test]
        public void Given_checklist_status_is_completed_and_consultant_NOT_blacklisted_then_DoesChecklistNeedToBeChecked_returns_false()
        {
            //GIVEN
            _getCompletedChecklistQuery.Setup(x => x.Count(_consultant.FullName))
                .Returns(() => 1);
            _consultant.RemoveFromBlacklist();
            var checklist = new Checklist() { Status = Checklist.STATUS_COMPLETED, QaAdvisor = null, ChecklistCreatedBy = "Tywin Lannister" };
            var target = GetTarget();

            //WHEN
            var result = target.DoesChecklistNeedToBeChecked(checklist);

            //THEN
            Assert.That(result, Is.False);
        }

        [Test]
        public void Given_checklist_status_is_completed_and_consultant_NOT_blacklisted_and_it_is_the_10th_checklist_that_they_Completed_then_DoesChecklistNeedToBeChecked_returns_true()
        {
            //GIVEN
            _getCompletedChecklistQuery.Setup(x => x.Count(_consultant.FullName))
                .Returns(() => 10);

            _consultant.RemoveFromBlacklist();
            var checklist = new Checklist() { Status = Checklist.STATUS_COMPLETED, QaAdvisor = null, ChecklistCreatedBy = _consultant.FullName };
            var target = GetTarget();

            //WHEN
            var result = target.DoesChecklistNeedToBeChecked(checklist);

            //THEN
            Assert.That(result, Is.True);
        }

        [Test]
        public void Given_checklist_status_is_completed_and_consultant_NOT_blacklisted_and_it_is_the_15th_checklist_that_they_Completed_then_DoesChecklistNeedToBeChecked_returns_true()
        {
            //GIVEN
            _getCompletedChecklistQuery.Setup(x => x.Count(_consultant.FullName))
                .Returns(() => 15);

            _consultant.RemoveFromBlacklist();
            var checklist = new Checklist() { Status = Checklist.STATUS_COMPLETED, QaAdvisor = null, ChecklistCreatedBy = _consultant.FullName };
            var target = GetTarget();

            //WHEN
            var result = target.DoesChecklistNeedToBeChecked(checklist);

            //THEN
            Assert.That(result, Is.True);
        }

        [Test]
        public void Given_checklist_status_is_completed_and_consultant_blacklisted_and_qaAdvisor_assigned_then_DoesChecklistNeedToBeChecked_returns_false()
        {
            //GIVEN
            _getCompletedChecklistQuery.Setup(x => x.Count(_consultant.FullName))
              .Returns(() => 0);
            _consultant.AddToBlacklist();
            var checklist = new Checklist() { Status = Checklist.STATUS_COMPLETED, QaAdvisor = new QaAdvisor(), ChecklistCreatedBy = "Tywin Lannister" };
            var target = GetTarget();

            //WHEN
            var result = target.DoesChecklistNeedToBeChecked(checklist);

            //THEN
            Assert.That(result, Is.False);
        }

        [Test]
        public void Given_checklist_status_is_NOT_completed_then_DoesChecklistNeedToBeChecked_returns_false()
        {   
            //GIVEN
            var checklist = new Checklist() { Status = Checklist.STATUS_DRAFT, QaAdvisor = null };
            var target = GetTarget();

            //WHEN
            var result = target.DoesChecklistNeedToBeChecked(checklist);

            //THEN
            Assert.That(result, Is.False);
        }


        [Test]
        public void Given_checklist_status_is_completed_and_checklist_is_special_report_then_DoesChecklistNeedToBeChecked_returns_false()
        {
            //GIVEN
            _getCompletedChecklistQuery
                .Setup(x => x.Count(_consultant.FullName))
                .Returns(() => 0);
           
            var checklist = new Checklist() { Status = Checklist.STATUS_COMPLETED, QaAdvisor = new QaAdvisor(), ChecklistCreatedBy = "Tywin Lannister", SpecialReport = true};
            var target = GetTarget();

            //WHEN
            var result = target.DoesChecklistNeedToBeChecked(checklist);

            //THEN
            Assert.That(result, Is.False);
        }


        public QualityControlService GetTarget()
        {
            return new QualityControlService(_dependencyFactory.Object);

        }
    }
}
