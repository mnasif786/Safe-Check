using System;
using System.Collections.Generic;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using Moq;
using NUnit.Framework;
using EvaluationChecklist.Models;

namespace EvaluationChecklist.Api.Tests.QaControllerTests
{
    [TestFixture]
    internal class PostGetQaAdvisorsTests
    {
        private Mock<IQaAdvisorRepository> _qaAdvisorRepository;
        private Mock<IDependencyFactory> _dependencyFactory;
        
        [SetUp]
        public void Setup()
        {
            _dependencyFactory = new Mock<IDependencyFactory>();
            _qaAdvisorRepository = new Mock<IQaAdvisorRepository>();

            _dependencyFactory.Setup(x => x.GetInstance<IQaAdvisorRepository>())
                .Returns(_qaAdvisorRepository.Object);
            
        }



        [Test]
        public void Given_QA_Advisors_exists_when_Post_then_qaAdvisor_is_updated()
        {
            QaAdvisor savedQaAdvisor = null;

            // Given
            var qaAdvisor = new QaAdvisor() { Id = Guid.NewGuid() };
            var model = new QaAdvisorViewModel(){Id = qaAdvisor.Id, Forename= "Stansa", Surname="Stark", InRotation = true};
            var target = new QaAdvisorController(_dependencyFactory.Object);

            _qaAdvisorRepository.Setup(x => x.GetById(qaAdvisor.Id))
                .Returns(() => qaAdvisor);

            _qaAdvisorRepository.Setup(x => x.SaveOrUpdate(It.IsAny<QaAdvisor>()))
                .Callback<QaAdvisor>(x => savedQaAdvisor = x);

            // When
            target.Post(model);

            // Then
            Assert.That(savedQaAdvisor.Id,Is.EqualTo(model.Id));
            Assert.That(savedQaAdvisor.InRotation, Is.EqualTo(model.InRotation));
            Assert.That(savedQaAdvisor.Forename, Is.EqualTo(model.Forename));
            Assert.That(savedQaAdvisor.Surname, Is.EqualTo(model.Surname));
        }



    }
}
