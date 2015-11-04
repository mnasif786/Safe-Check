using System;
using System.Net;
using System.Web.Http;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Models;
using log4net;

namespace EvaluationChecklist.Controllers
{
    [Authorize]
    public class MaintenanceUserController : ApiController
    {
        public readonly IMaintenanceUserRepository _maintenanceUserRepository;

        public MaintenanceUserController(IDependencyFactory dependencyFactory)
        {
            _maintenanceUserRepository = dependencyFactory.GetInstance<IMaintenanceUserRepository>();
        }

        [Authorize]
        public MaintenanceUserViewModel Get()
        {
            if (string.IsNullOrEmpty(User.Identity.Name))
            {
                throw new HttpResponseException(HttpStatusCode.NotFound);
            }

            try
            {
                var user = User.Identity.Name.Split('\\')[1];
                
                var maintenanceUser = _maintenanceUserRepository.GetByUserName(user);

                if (maintenanceUser != null)
                {
                    return new MaintenanceUserViewModel()
                    {
                        Id = maintenanceUser.Id,
                        Forename = maintenanceUser.Forename,
                        Surname = maintenanceUser.Surname,
                        Email = maintenanceUser.Email
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(MaintenanceUserController)).Error(ex);
                throw;
            }
        }
    }
}
