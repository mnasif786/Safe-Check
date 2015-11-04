using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Text;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.InfrastructureContracts.Logging;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using Moq;
using NUnit.Framework;

namespace EvaluationChecklist.Api.Tests.ChecklistControllerTests
{
    [TestFixture]
    public class CopyChecklistTests
    {
        private Mock<ICheckListRepository> _checklistRepo;
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IUserForAuditingRepository> _userForAuditing;
        private Mock<IChecklistService> _checklistService;
        private Mock<IUserIdentityFactory> _userIdentityFactory;

        [SetUp]
        public void Setup()
        {
            _checklistRepo = new Mock<ICheckListRepository>();
            _userForAuditing = new Mock<IUserForAuditingRepository>();
            _checklistService = new Mock<IChecklistService>();
            _userIdentityFactory = new Mock<IUserIdentityFactory>();
            _dependencyFactory = new Mock<IDependencyFactory>();

            _dependencyFactory
                .Setup(x => x.GetInstance<ICheckListRepository>())
                .Returns(()=> _checklistRepo.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IUserForAuditingRepository>())
                .Returns(() =>_userForAuditing.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IChecklistService>())
                .Returns(() => _checklistService.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IUserIdentityFactory>())
                .Returns(() => _userIdentityFactory.Object);

            _userIdentityFactory
                .Setup(x => x.GetUserIdentity(It.IsAny<IPrincipal>()))
                .Returns(() => new UserIdentity("test name"));
        }

        [Test]
        public void given_checklist_when_CopyToSiteWithoutResponses_then_checklist_copied_to_sites()
        {
            //GIVEN
            var checklist = new Checklist() {Id = Guid.NewGuid(), SiteId = 13123};
            _checklistRepo
                .Setup(x => x.GetById(checklist.Id))
                .Returns(() => checklist);
            var siteIds = new int[] { 12,13,14 };

            var target = new ChecklistController(_dependencyFactory.Object);

           
            //when
            var result = target.CopyToSiteWithoutResponses(checklist.Id, siteIds);

            //then
            _checklistService.Verify(x => x.CopyToSiteWithoutResponses(checklist.Id, siteIds[0], "test name"));
            _checklistService.Verify(x => x.CopyToSiteWithoutResponses(checklist.Id, siteIds[1], "test name"));
            _checklistService.Verify(x => x.CopyToSiteWithoutResponses(checklist.Id, siteIds[2], "test name"));

            Assert.That(result.Count, Is.EqualTo(3));

        }
    }
}
