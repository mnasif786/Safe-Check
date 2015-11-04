using System;
using System.Configuration;
using BusinessSafe.Application.Common;
using BusinessSafe.Data.Common;
using BusinessSafe.Data.NHibernate.BusinessSafe;
using BusinessSafe.Data.Repository.SafeCheck;
using BusinessSafe.Domain.Common;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.ClientDetails;
using EvaluationChecklist.Controllers;
using EvaluationChecklist.Helpers;
using NServiceBus;
using Peninsula.Online.Data.NHibernate.ApplicationServices;
using RestSharp;
using StructureMap;
using BusinessSafe.Infrastructure.Security;

namespace EvaluationChecklist.App_Start
{
    public static class IocConfig
    {
        public static void Setup()
        {
            var clientDetailsServicesUrl = ConfigurationManager.AppSettings["ClientDetailsServices.Rest.BaseUrl"];

            ObjectFactory.Initialize(x =>
            {
                x.ForSingletonOf<IBusinessSafeSessionFactory>().Use<BusinessSafeSessionFactory>();
                x.For<IBusinessSafeSessionManager>().HybridHttpOrThreadLocalScoped().Use<BusinessSafeSessionManager>();
                x.For<IBusinessSafeSessionManagerFactory>().Use<BusinessSafeSessionManagerFactory>();
                x.AddRegistry<ApplicationRegistry>();
                x.For<IDependencyFactory>().Use(new StructureMapDependencyFactory());
                x.For<IClientDetailsService>().Use<ClientDetailsREST>();
                x.For<IRestClient>().Use(new RestClient(clientDetailsServicesUrl)).Named("ClientDetailsServices");
                x.For<IPDFGenerator>().Use<EvoPDFGenerator>();
                x.For<IChecklistPdfCreator>().Use<ChecklistPdfCreator>();
                x.For<IClientDocumentationChecklistPdfWriter>().Use<ClientDocumentationChecklistPdfWriter>();
                x.For<IBus>().Use(Global.Bus);
                x.For<IImpersonator>().Use<Impersonator>();
                x.For<IQualityControlService>().Use<QualityControlService>();
                x.For<IActiveDirectoryService>().Use<ActiveDirectoryServiceFacade>();
                x.For<IChecklistService>().Use<ChecklistService>();
                x.For<IUserIdentityFactory>().Use<UserIdentityFactory>();
                x.For<IFavouriteChecklistRepository>().Use<FavouriteChecklistRepository>();
            });
        }

       
    }

    
}
