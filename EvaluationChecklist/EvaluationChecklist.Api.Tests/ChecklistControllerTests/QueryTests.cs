using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Text;
using System.Threading;
using BusinessSafe.Application.RestAPI.Responses;
using BusinessSafe.Data.Queries.SafeCheck;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.ClientDetails;
using EvaluationChecklist.ClientDetails.Models;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using Moq;
using NUnit.Framework;

namespace EvaluationChecklist.Api.Tests.ChecklistControllerTests
{
    [TestFixture]
    public class QueryTests
    {
        private Mock<ICheckListRepository> _checklistRepo;
        private Mock<IClientDetailsService> _clientDetailsService;
        private Mock<IDependencyFactory> _dependencyFactory;
        private Mock<IGetChecklistsQuery> _getChecklistsQuery;
        private Mock<ICheckListRepository> _checklistRepository;
        private Mock<IQaAdvisorRepository> _qaAdvisorRepository;
        private Mock<IUserIdentityFactory> _userIdentityFactory;
        private Mock<IQualityControlService> _qualityControlService;
        private Mock<IFavouriteChecklistRepository> _favouriteChecklistRepository;

        [SetUp]
        public void Setup()
        {
            _checklistRepo = new Mock<ICheckListRepository>();
            _clientDetailsService = new Mock<IClientDetailsService>();
            _getChecklistsQuery = new Mock<IGetChecklistsQuery>();
            _checklistRepository = new Mock<ICheckListRepository>();
            _qaAdvisorRepository = new Mock<IQaAdvisorRepository>();
            _userIdentityFactory = new Mock<IUserIdentityFactory>();
            _qualityControlService = new Mock<IQualityControlService>();
            _favouriteChecklistRepository = new Mock<IFavouriteChecklistRepository>();

            _dependencyFactory = new Mock<IDependencyFactory>();
            _dependencyFactory
                .Setup(x => x.GetInstance<ICheckListRepository>())
                .Returns(() => _checklistRepo.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IClientDetailsService>())
                .Returns(() => _clientDetailsService.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IGetChecklistsQuery>())
                .Returns(() => _getChecklistsQuery.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<ICheckListRepository>())
                .Returns(() => _checklistRepository.Object);

            _dependencyFactory
               .Setup(x => x.GetInstance<IQaAdvisorRepository>())
               .Returns(() => _qaAdvisorRepository.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IGetChecklistsQuery>())
                .Returns(() => _getChecklistsQuery.Object);

            _dependencyFactory
              .Setup(x => x.GetInstance<IUserIdentityFactory>())
              .Returns(_userIdentityFactory.Object);

            _dependencyFactory
                .Setup(x => x.GetInstance<IQualityControlService>())
                .Returns(() => new QualityControlService(_dependencyFactory.Object));

            _dependencyFactory
                .Setup(x => x.GetInstance<IFavouriteChecklistRepository>())
                .Returns(_favouriteChecklistRepository.Object);

            var identity = new Mock<IIdentity>();
            _dependencyFactory.Setup(x => x.GetInstance<IIdentity>())
                .Returns(identity.Object);
            identity.Setup(x => x.Name).Returns("domain\\abc.xyz");

            var principal = new Mock<IPrincipal>();
            principal.Setup(x => x.Identity).Returns(identity.Object);

            Thread.CurrentPrincipal = principal.Object;

            _userIdentityFactory.Setup(x => x.GetUserIdentity(It.IsAny<IPrincipal>())).Returns(new UserIdentity(Thread.CurrentPrincipal));
        }

        [Test]
        public void Given_i_query_by_client_account_number_then_the_site_details_are_set()
        {
            //given
            var clientId = 234234;
            var clientAccountNumber = "TESTACTULAR";
            var expectedPostcode = "MARS 7TU";
            var expectedSiteName = "Rekall";
            var expectedAddress = "29 Acaciar Road";
            var expectedStatus = "Open";
            var checklist = new Checklist();

            var site = new SiteAddressResponse() {Id = 1212431241, SiteName = expectedSiteName, Postcode = expectedPostcode, Address1 = expectedAddress};

            _clientDetailsService
                .Setup(x => x.GetSite(clientId, (int) site.Id))
                .Returns(() => site);

            _clientDetailsService
                .Setup(x => x.GetByClientAccountNumber(clientAccountNumber))
                .Returns(() => new CompanyDetailsResponse() {CAN = clientAccountNumber, Id = clientId});

            _clientDetailsService
                .Setup(x => x.Get(It.IsAny<int>()))
                .Returns(new CompanyDetails() { CAN = "Can" });


            _checklistRepository.Setup(x => x.Search(clientId, null, null, null, false, null))
               .Returns(() => new List<Checklist>()
                                  {
                                      new Checklist() {ClientId = clientId, SiteId = (int?) site.Id, Status = expectedStatus}
                                  });

            _checklistRepository.Setup(x => x.GetById(It.IsAny<Guid>()))
               .Returns(checklist);

            _getChecklistsQuery.Setup(x => x.WithClientId(It.IsAny<int>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithConsultantName(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatus(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatusDateBetween(It.IsAny<DateTime?>(), It.IsAny<DateTime?>())).Returns(_getChecklistsQuery.Object);

            _getChecklistsQuery.Setup(x=> x.Execute())
                .Returns(() => new List<ChecklistIndex>()
                                  {
                                      new ChecklistIndex() {ClientId = clientId, SiteId = (int?) site.Id, Status = expectedStatus}
                                  });

            //when
            var target = new ChecklistController(_dependencyFactory.Object);

            var result = target.Query(clientAccountNumber, null, null, null, false, false, null,null);

            Assert.That(result.First().Site.Postcode, Is.EqualTo(expectedPostcode));
            Assert.That(result.First().Site.SiteName, Is.EqualTo(expectedSiteName));
            Assert.That(result.First().Site.Address1, Is.EqualTo(expectedAddress));
            Assert.That(result.First().Status, Is.EqualTo(expectedStatus));
        }

        [Test]
        public void given_parameters_when_query_then_execute_is_called_with_correct_parameters()
        {
            //given
            int clientId = 1234;
            string can = "CAN01";
            string checklistCreatedBy ="consultant.name";
            string visitDate = DateTime.Now.ToShortDateString();
            string checklistStatus = "Draft";
            bool includeDeleted = false;
            bool excludeSubmitted = true;
            var checklist = new Checklist();

            var site = new SiteAddressResponse() {Id = 1234L,};
                  _clientDetailsService
                .Setup(x => x.GetByClientAccountNumber(can))
                .Returns(() => new CompanyDetailsResponse() {CAN = can, Id = clientId});

            _clientDetailsService
                .Setup(x => x.Get(It.IsAny<int>()))
                .Returns(new CompanyDetails() {CAN = "Can"});

            _clientDetailsService
                .Setup(x => x.GetSite(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(() => site);

            
            _getChecklistsQuery.Setup(x => x.WithClientId(It.IsAny<int>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatus(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatusDateBetween(It.IsAny<DateTime?>(), It.IsAny<DateTime?>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithConsultantName(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);

            _getChecklistsQuery
                .Setup(
                    x =>
                    x.Execute())
                .Returns(() => new List<ChecklistIndex>()
                                  {
                                      new ChecklistIndex() {ClientId = clientId, SiteId = (int?) site.Id, Status = checklistStatus}
                                  });

            _checklistRepository.Setup(x => x.GetById(It.IsAny<Guid>()))
               .Returns(checklist);
            //when
            var target = new ChecklistController(_dependencyFactory.Object);

            
            target.Query(can, checklistCreatedBy, visitDate, checklistStatus, includeDeleted, excludeSubmitted, null, null);

            //then
            _getChecklistsQuery
                .Verify(
                    x =>
                    x.Execute());

        }

        [Test]
        public void Given_i_query_by_user_then_the_createBy_and_qaAdvisor_are_queried()
        {
            var clientId = 234234;
            var clientAccountNumber = "TESTACTULAR";
            var expectedPostcode = "MARS 7TU";
            var expectedSiteName = "Rekall";
            var expectedAddress = "29 Acaciar Road";
            var userName = "Jack Reacher";
            var qaAdvisorId = Guid.NewGuid();

            var site = new SiteAddressResponse() { Id = 1212431241, SiteName = expectedSiteName, Postcode = expectedPostcode, Address1 = expectedAddress };

            _clientDetailsService
                .Setup(x => x.GetSite(clientId, (int)site.Id))
                .Returns(() => site);

            _clientDetailsService
                .Setup(x => x.GetByClientAccountNumber(clientAccountNumber))
                .Returns(() => new CompanyDetailsResponse() { CAN = clientAccountNumber, Id = clientId });

            _clientDetailsService
                .Setup(x => x.Get(It.IsAny<int>()))
                .Returns(new CompanyDetails() { CAN = "Can" });


            _qaAdvisorRepository
                .Setup(x => x.GetByFullname(userName))
                .Returns(() => new QaAdvisor() {Id = qaAdvisorId, Forename = "Jack", Surname = "Reacher"});


            _getChecklistsQuery.Setup(x => x.WithConsultantName(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithClientId(It.IsAny<int>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatus(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatusDateBetween(It.IsAny<DateTime?>(), It.IsAny<DateTime?>())).Returns(_getChecklistsQuery.Object);

            //when
            var target = new ChecklistController(_dependencyFactory.Object);

            var result = target.Query(null, userName, null, null, false, false, null, null); 


            _getChecklistsQuery
                .Verify(x => x.Execute(),Times.Once);

        }

        [Test]
        public void Given_a_query_and_dates_are_GMT_then_dates_return_as_UTC()
        {
            //given

            var GMTDate = new DateTime(2014, 2, 18);
            var clientId = 234234;
            var clientAccountNumber = "TESTACTULAR";
            var checklist = new Checklist();

            var site = new SiteAddressResponse() { Id = 1212431241};

            _clientDetailsService
                .Setup(x => x.GetSite(clientId, (int)site.Id))
                .Returns(() => site);

            _clientDetailsService
                .Setup(x => x.GetByClientAccountNumber(clientAccountNumber))
                .Returns(() => new CompanyDetailsResponse() { CAN = clientAccountNumber, Id = clientId });

            _clientDetailsService
                .Setup(x => x.Get(It.IsAny<int>()))
                .Returns(new CompanyDetails() { CAN = "Can" });

            _getChecklistsQuery.Setup(x => x.WithClientId(It.IsAny<int>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithConsultantName(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatus(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatusDateBetween(It.IsAny<DateTime?>(), It.IsAny<DateTime?>())).Returns(_getChecklistsQuery.Object);

            _getChecklistsQuery.Setup(x => x.Execute())
                .Returns(() => new List<ChecklistIndex>()
                                  {
                                      new ChecklistIndex() {ClientId = clientId, SiteId = (int?) site.Id, Status = "Open", VisitDate = GMTDate, CompletedDate = GMTDate, SubmittedDate = GMTDate,QaAdvisorAssignedOn = GMTDate}
                                  });

            //when
            var target = new ChecklistController(_dependencyFactory.Object);

            var result = target.Query(clientAccountNumber, null, null, null, false, false, null, null);

            Assert.That(result.First().VisitDate, Is.EqualTo(GMTDate.ToUniversalTime()));
            Assert.That(result.First().CompletedOn, Is.EqualTo(GMTDate.ToUniversalTime()));
            Assert.That(result.First().SubmittedOn, Is.EqualTo(GMTDate.ToUniversalTime()));
            Assert.That(result.First().QaAdvisorAssignedOn, Is.EqualTo(GMTDate.ToUniversalTime()));
        }

        [Test]
        public void Given_a_query_and_dates_are_BST_then_dates_return_as_UTC()
        {
            //given
            var BSTDate = new DateTime(2014, 04, 06);
            var clientId = 234234;
            var clientAccountNumber = "TESTACTULAR";
            var expectedStatus = "Open";
            var checklist = new Checklist(){VisitDate = BSTDate};

            var site = new SiteAddressResponse() {Id = 1212431241, SiteName = "Rekall", Postcode = "MARS 7TU"};

            _clientDetailsService
                .Setup(x => x.GetSite(clientId, (int)site.Id))
                .Returns(() => site);

            _clientDetailsService
                .Setup(x => x.GetByClientAccountNumber(clientAccountNumber))
                .Returns(() => new CompanyDetailsResponse() { CAN = clientAccountNumber, Id = clientId });

            _clientDetailsService
                .Setup(x => x.Get(It.IsAny<int>()))
                .Returns(new CompanyDetails() { CAN = "Can" });


            _getChecklistsQuery.Setup(x => x.WithClientId(It.IsAny<int>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithConsultantName(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatus(It.IsAny<string>())).Returns(_getChecklistsQuery.Object);
            _getChecklistsQuery.Setup(x => x.WithStatusDateBetween(It.IsAny<DateTime?>(), It.IsAny<DateTime?>())).Returns(_getChecklistsQuery.Object);

            _getChecklistsQuery.Setup(x => x.Execute())
                .Returns(() => new List<ChecklistIndex>()
                                  {
                                      new ChecklistIndex() {ClientId = clientId, SiteId = (int?) site.Id, Status = expectedStatus, VisitDate = BSTDate, CompletedDate = BSTDate, SubmittedDate = BSTDate, QaAdvisorAssignedOn = BSTDate}
                                  });

            //when
            var target = new ChecklistController(_dependencyFactory.Object);

            var result = target.Query(clientAccountNumber, null, null, null, false, false, null, null);

            Assert.That(result.First().VisitDate, Is.EqualTo(BSTDate.ToUniversalTime()));
            Assert.That(result.First().CompletedOn, Is.EqualTo(BSTDate.ToUniversalTime()));
            Assert.That(result.First().SubmittedOn, Is.EqualTo(BSTDate.ToUniversalTime()));
            Assert.That(result.First().QaAdvisorAssignedOn, Is.EqualTo(BSTDate.ToUniversalTime()));
        }
      
    }
}
