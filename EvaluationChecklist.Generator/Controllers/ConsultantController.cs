using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Mappers;
using EvaluationChecklist.Models;
using log4net;
using BusinessSafe.Domain.Entities.SafeCheck;

namespace EvaluationChecklist.Controllers
{
    [Authorize]
    public class ConsultantController : ApiController
    {
        private readonly IConsultantRepository _consultantRepository;
        private readonly BusinessSafe.Domain.RepositoryContracts.IUserForAuditingRepository _userForAuditingRepository;
        private readonly IActiveDirectoryService _activeDirectoryService;

        public ConsultantController(IDependencyFactory dependencyFactory)
        {
            _consultantRepository = dependencyFactory.GetInstance<IConsultantRepository>();
            _activeDirectoryService = dependencyFactory.GetInstance<IActiveDirectoryService>(); // new ActiveDirectoryService("HQ", "DC=hq,DC=peninsula-uk,DC=local", @"hq\veritas", "is74rb80pk52");
			_userForAuditingRepository = dependencyFactory.GetInstance<BusinessSafe.Domain.RepositoryContracts.IUserForAuditingRepository>();
        }

        /// <summary>
        /// Returns a list of consultants
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public List<ConsultantViewModel> Get()
        {
            try
            {
                return _consultantRepository.GetAll()
                    .Where(x=> !x.Deleted)
                    .Map().ToList();
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ConsultantController)).Error(ex);
                throw;
            }
        }


        /// <summary>
        /// Add consultant
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        [HttpPut]
        public HttpResponseMessage Put(string username)
        {
           // try
            {
                if (!_activeDirectoryService.DoesUserExist(username))
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound,"Username not found. Please ensure that the user has been added to the network");
                }

                var adUser = _activeDirectoryService.GetUser(username);

                var consultant = _consultantRepository.GetByUsername(username, true);
                if (consultant != null)
                {
                    consultant.ReinstateFromDelete(_userForAuditingRepository.GetSystemUser());
                    consultant.Email = adUser.EmailAddress;
                }
                else
                {
                    consultant = Consultant.Create(username, adUser.Forename, adUser.Surname, adUser.EmailAddress);
                    consultant.Id = Guid.NewGuid();
                }

                _consultantRepository.SaveOrUpdate(consultant);
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            //catch (Exception ex)
            //{
            //    LogManager.GetLogger(typeof(ConsultantController)).Error(ex);
            //    throw;
            //}
        }

        /// <summary>
        /// Update consultant
        /// </summary>
        /// <param name="model"></param>
        [HttpPost]
        public HttpResponseMessage Post(ConsultantViewModel model)
        {
            try
            {
                var consultant = _consultantRepository.GetById(model.Id);
                if (consultant == null)
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                }
                else
                {
                    consultant.Forename = model.Forename;
                    consultant.Surname = model.Surname;
                    consultant.Email = model.Email;
                    consultant.QaAdvisorAssigned = model.QaAdvisorAssigned;
                    if (model.Blacklisted)
                    {
                        consultant.AddToBlacklist();
                    }
                    else
                    {
                        consultant.RemoveFromBlacklist();
                    }
                }

                _consultantRepository.SaveOrUpdate(consultant);
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ConsultantController)).Error(ex);
                throw;
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        /// <summary>
        /// Marks a consultant as deleted
        /// </summary>
        /// <param name="id"></param>
        [HttpDelete]
        public void Delete(Guid id)
        {
            try
            {
                var consultant = _consultantRepository.GetById(id);
                if (consultant == null) return;
                var user = _userForAuditingRepository.GetSystemUser();
                consultant.MarkForDelete(user);

                _consultantRepository.SaveOrUpdate(consultant);
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof (ConsultantController)).Error(ex);
                throw;
            }
        }
    }

}
