using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
//using Peninsula.Security.ActiveDirectory;
using EvaluationChecklist.Helpers;
using StructureMap;

namespace EvaluationChecklist.Controllers
{
    public class AccountController : ApiController
    {
        private readonly IConsultantRepository _consultantRepository;

        public AccountController()
        {
            _consultantRepository = ObjectFactory.GetInstance<IConsultantRepository>();
        }


        [Authorize]
        public HttpResponseMessage Get()
        {

            if (string.IsNullOrEmpty(User.Identity.Name))
            {
                throw new HttpResponseException(HttpStatusCode.NotFound);
            }

            try
            {

                var peninsulaUser = new UserIdentity(User);

                var consultant = _consultantRepository.GetByUsername(peninsulaUser.Username, false);
                var email = consultant != null ? consultant.Email : string.Empty;

                var response = Request.CreateResponse(HttpStatusCode.OK, new {domain = peninsulaUser.Domain, firstname = peninsulaUser.Firstname, surname = peninsulaUser.Surname, email });

                return response;
            }
            catch (Exception)
            {
                throw new HttpResponseException(HttpStatusCode.InternalServerError);
            }
        }
    }
}
