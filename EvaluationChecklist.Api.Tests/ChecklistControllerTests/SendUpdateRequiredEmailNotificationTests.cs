﻿using System;
using System.Net.Http;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.ClientDetails;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NUnit.Framework;
using NServiceBus;

namespace EvaluationChecklist.Api.Tests.ChecklistControllerTests
{
    [TestFixture]
    public class SendUpdateRequiredEmailNotificationTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<ICheckListRepository> _checklistRepository;
        private Mock<IQaAdvisorRepository> _qaAdvisorRepository;
        private Mock<IUserForAuditingRepository> _userForAuditing;
        private Mock<IClientDetailsService> _clientDetailsService;
        private Mock<IBus> _iBus;
        private BusinessSafe.Domain.Entities.UserForAuditing _user;
        private Mock<IQualityControlService> _qualityControlService;

        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();
            _checklistRepository = new Mock<ICheckListRepository>();
            _qaAdvisorRepository = new Mock<IQaAdvisorRepository>();
            _userForAuditing = new Mock<IUserForAuditingRepository>();
            _clientDetailsService = new Mock<IClientDetailsService>();
            _iBus = new Mock<IBus>();
            _qualityControlService = new Mock<IQualityControlService>();

            _dependencyFactory
                .Setup(x => x.GetInstance<ICheckListRepository>())
                .Returns(_checklistRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQaAdvisorRepository>())
                .Returns(_qaAdvisorRepository.Object);

            _dependencyFactory
               .Setup(x => x.GetInstance<IUserForAuditingRepository>())
               .Returns(_userForAuditing.Object);

            _dependencyFactory
              .Setup(x => x.GetInstance<IClientDetailsService>())
              .Returns(_clientDetailsService.Object);

            _dependencyFactory
             .Setup(x => x.GetInstance<IClientDetailsService>())
             .Returns(_clientDetailsService.Object);

            _dependencyFactory
               .Setup(x => x.GetInstance<IBus>())
               .Returns(_iBus.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQualityControlService>())
                .Returns(() => new QualityControlService(_dependencyFactory.Object));

            _user = new BusinessSafe.Domain.Entities.UserForAuditing() { Id = Guid.NewGuid(), CompanyId = 1 };

            _userForAuditing.Setup(x => x.GetSystemUser()).Returns(_user);
        }

        [Test]
        public void Given_a_checklist_when_assigning_then_updated_required_is_added()
        {
            //GIVN
            var checklist = new Checklist() {Id = Guid.NewGuid()};
            var qaAdvisor = new QaAdvisor();

            _checklistRepository
               .Setup(x => x.GetById(It.IsAny<Guid>()))
               .Returns(() => checklist);

            _qaAdvisorRepository
               .Setup(x => x.GetById(It.IsAny<Guid>()))
               .Returns(() => qaAdvisor);


            var target = GetTarget();
            var viewModel = new QaAdvisorViewModel();
            viewModel.Id = Guid.NewGuid();

            //WHEN
            target.SendUpdateRequiredEmailNotification(checklist.Id);

            Assert.That(checklist.UpdatesRequiredLog.Count, Is.EqualTo(1));
        }

        public ChecklistController GetTarget()
        {
            var controller = new ChecklistController(_dependencyFactory.Object);
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}
