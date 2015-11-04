using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Security.Principal;
using System.Threading;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NUnit.Framework;

namespace EvaluationChecklist.Api.Tests.MaintenanceUserControllerTests
{
    [TestFixture]
    public class MaintenanceUserTest
    {
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IMaintenanceUserRepository> _maintenanceUserRepository;

        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();

            _maintenanceUserRepository = new Mock<IMaintenanceUserRepository>();

            _dependencyFactory.Setup(x => x.GetInstance<IMaintenanceUserRepository>())
                .Returns(_maintenanceUserRepository.Object);

        }

        [Test]
        public void given_user_is_a_member_of_Maintenance_users_method_returns_maintenance_user()
        {
            var user = new MaintenanceUser() { Username = "gareth.wilby", Deleted = false, Email = "gareth.wilby@abc.com", Id = Guid.NewGuid(), Forename = "gareth", Surname = "wilby"};

            _maintenanceUserRepository.Setup(x => x.GetByUserName(It.IsAny<string>())).Returns(user);

            var identity = new Mock<IIdentity>();
            _dependencyFactory.Setup(x => x.GetInstance<IIdentity>())
                .Returns(identity.Object);
            identity.Setup(x => x.Name).Returns("domain\\gareth.wilby");

            var principal = new Mock<IPrincipal>();
            principal.Setup(x => x.Identity).Returns(identity.Object);

            Thread.CurrentPrincipal = principal.Object;

            var controller = GetTarget();

            var result = controller.Get();

            Assert.That(result.Forename, Is.EqualTo(user.Forename));
            Assert.That(result.Surname, Is.EqualTo(user.Surname));
            Assert.That(result.Email, Is.EqualTo(user.Email));
        }
        
        public MaintenanceUserController GetTarget()
        {
            var controller = new MaintenanceUserController(_dependencyFactory.Object);
            controller.Request = new HttpRequestMessage();
            return controller;
        }
    }
}
