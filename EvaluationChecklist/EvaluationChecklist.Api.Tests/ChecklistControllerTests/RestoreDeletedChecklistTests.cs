using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using Moq;
using NUnit.Framework;
using Checklist = BusinessSafe.Domain.Entities.SafeCheck.Checklist;

namespace EvaluationChecklist.Api.Tests.ChecklistControllerTests
{
    [TestFixture]
    public class RestoreDeletedChecklistTests
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<ICheckListRepository> _checklistRepository;
        private Mock<IUserForAuditingRepository> _userForAuditing;
        private UserForAuditing _user;

        [SetUp]
        public void SetUp()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();
            _checklistRepository = new Mock<ICheckListRepository>();
            _userForAuditing = new Mock<IUserForAuditingRepository>();


            _dependencyFactory
                .Setup(x => x.GetInstance<ICheckListRepository>())
                .Returns(_checklistRepository.Object);

            _user = new UserForAuditing() { Id = Guid.NewGuid(), CompanyId = 1 };

            _userForAuditing.Setup(x => x.GetSystemUser()).Returns(_user);
        }


        [Test]
        public void Given_checklist_is_deleted_on_server_When_restore_checklist_is_called_Then_checklist_is_restored()
        {
            Guid checklistId = Guid.NewGuid();

            Checklist checklist = new Checklist();
            checklist.Id = checklistId;
            checklist.Deleted = true;
            checklist.DeletedBy = "Dee Litre";
            checklist.DeletedOn = DateTime.Now;
            
            _checklistRepository
               .Setup(x => x.GetById(checklistId))
               .Returns(checklist);

            _dependencyFactory
               .Setup(x => x.GetInstance<IUserForAuditingRepository>())
               .Returns(_userForAuditing.Object);
            
            Checklist savedChecklist = null;
            _checklistRepository.Setup(x => x.SaveOrUpdate(It.IsAny<Checklist>()))
                .Callback(
                    delegate(Checklist x)
                    {
                        savedChecklist = x;
                    }
                );

            var controller = GetTarget();
            var response = controller.RestoreDeletedChecklist(checklistId);

            Assert.AreEqual(false, savedChecklist.Deleted);
            Assert.AreEqual(null, savedChecklist.DeletedBy);
            Assert.AreEqual(null, savedChecklist.DeletedOn);


        }





    public ChecklistController GetTarget()
        {
            var controller = new ChecklistController(_dependencyFactory.Object);
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}
