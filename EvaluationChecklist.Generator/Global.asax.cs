using System;
using System.Web.Http;
using System.Web.Mvc;
using EvaluationChecklist.App_Start;
using EvaluationChecklist.Helpers;
using NServiceBus;
using Peninsula.Online.Data.NHibernate.ApplicationServices;
using StructureMap;
using log4net;

namespace EvaluationChecklist
{
    public class Global : System.Web.HttpApplication
    {
        public static IBus Bus;

        protected void Application_Start(object sender, EventArgs e)
        {
            Bus = Configure.With()
                .DefaultBuilder()
                .DBSubcriptionStorage()
                .Log4Net()
                .UnicastBus()
                .MsmqTransport()
                .XmlSerializer()
                .DisableRavenInstall()
                .CreateBus()
                .Start(
                    () =>
                    Configure.Instance.ForInstallationOn<NServiceBus.Installation.Environments.Windows>().Install());

            AreaRegistration.RegisterAllAreas();
            IocConfig.Setup();
            GlobalConfiguration.Configuration.DependencyResolver = new StructureMapDependencyResolver();
            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);

            if (Environment.MachineName.ToUpper() == "PBS43758")
            {
                HibernatingRhinos.Profiler.Appender.NHibernate.NHibernateProfiler.Initialize();
            }


            log4net.Config.XmlConfigurator.Configure();


            LogManager.GetLogger(typeof (Global)).Info("Application Started");

        }

        void Application_EndRequest(object sender, EventArgs e)
        {
            var sessionManager = ObjectFactory.GetInstance<IBusinessSafeSessionManager>();
            sessionManager.CloseSession();
        }
    }
}