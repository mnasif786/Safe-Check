using System;
using System.Net.Http;
using System.Security.Principal;
using System.Threading;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using Moq;
using NUnit.Framework;
using Checklist = BusinessSafe.Domain.Entities.SafeCheck.Checklist;
using IQuestionRepository = BusinessSafe.Domain.RepositoryContracts.SafeCheck.IQuestionRepository;

namespace EvaluationChecklist.Api.Tests.ChecklistControllerTests
{
    [TestFixture]
    public class CopyChecklistAnswers
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<ICheckListRepository> _checklistRepository;
        private Mock<IQuestionRepository> _questionRepository;
        private Mock<IUserIdentityFactory> _userIdentityFactory;
        private UserForAuditing _user;
        private Mock<IUserForAuditingRepository> _userForAuditing;
        private Mock<IChecklistService> _checklistService;
       
     
        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();
            _checklistRepository = new Mock<ICheckListRepository>();
            _questionRepository = new Mock<IQuestionRepository>();
            _userForAuditing = new Mock<IUserForAuditingRepository>();
            _userIdentityFactory = new Mock<IUserIdentityFactory>();
            _checklistService = new Mock<IChecklistService>();

            _dependencyFactory
                 .Setup(x => x.GetInstance<ICheckListRepository>())
                 .Returns(_checklistRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQuestionRepository>())
                .Returns(_questionRepository.Object);

            _dependencyFactory
                 .Setup(x => x.GetInstance<IQuestionRepository>())
                 .Returns(_questionRepository.Object);

            _dependencyFactory
              .Setup(x => x.GetInstance<IUserForAuditingRepository>())
              .Returns(_userForAuditing.Object);

            _dependencyFactory
               .Setup(x => x.GetInstance<IUserIdentityFactory>())
               .Returns(_userIdentityFactory.Object);

            _dependencyFactory
              .Setup(x => x.GetInstance<IChecklistService>())
              .Returns(_checklistService.Object);
            
            _user = new UserForAuditing() { Id = Guid.NewGuid(), CompanyId = 1 };

          
        }

        [Test]
        public void Given_Checklist_Exists_and_is_copied_check_answers_are_set()
        {
            var checklist = new Checklist() { Id = Guid.NewGuid(), SiteId = 1234 };

            var identity = new Mock<IIdentity>();
            _dependencyFactory.Setup(x => x.GetInstance<IIdentity>())
                .Returns(identity.Object);
            identity.Setup(x => x.Name).Returns("domain\\gareth.wilby");

            var principal = new Mock<IPrincipal>();
            principal.Setup(x => x.Identity).Returns(identity.Object);

            Thread.CurrentPrincipal = principal.Object;

            _userIdentityFactory.Setup(x => x.GetUserIdentity(It.IsAny<IPrincipal>())).Returns(new UserIdentity(Thread.CurrentPrincipal));
            _checklistRepository
                .Setup(x => x.GetById(It.IsAny<Guid>()))
                .Returns(checklist);

            _checklistService.Setup(x =>
                x.CopyToSiteWithResponses(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<bool>()))
                .Returns(Guid.NewGuid);
                

            int[] siteIds = { 1 };

            var controller = GetTarget();
            var response = controller.CopyToSiteWithResponses(checklist.Id, 123, false, siteIds);
            Assert.That(response[0].ChecklistId, Is.Not.EqualTo(checklist.Id));
        }

        public ChecklistController GetTarget()
        {
            var controller = new ChecklistController(_dependencyFactory.Object);
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}
