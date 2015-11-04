using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.Helpers;
using EvaluationChecklist.Mappers;
using EvaluationChecklist.Models;
using log4net;
using BusinessSafe.Domain.Entities.SafeCheck;

namespace EvaluationChecklist.Controllers
{
    /// <summary>
    /// 
    /// </summary>
    [Authorize]
    public class QaAdvisorController : ApiController
    {
        const string HSReportsAdvisorId = "3A204FB3-1956-4EFC-BE34-89F7897570DB";
        private readonly IQaAdvisorRepository _qaAdvisorRepository;
        private readonly IQualityControlService _qualityControlService;

        /// <summary>
        /// 
        /// </summary>
        public QaAdvisorController(IDependencyFactory dependencyFactory)
        {
            _qaAdvisorRepository = dependencyFactory.GetInstance<IQaAdvisorRepository>();
            _qualityControlService = dependencyFactory.GetInstance<IQualityControlService>();
        }

        /// <summary>
        /// Returns a list of qa Advisors
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public List<QaAdvisorViewModel> Get()
        {
            try
            {
                return RetrieveListOfQaAdvisors();
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(QaAdvisorController)).Error(ex);
                throw;
            }
        }

        private List<QaAdvisorViewModel> RetrieveListOfQaAdvisors()
        {
            var hsReportsAdvisorId = Guid.Parse(HSReportsAdvisorId);
            var advisors = _qaAdvisorRepository.GetAll()
                .Where(x => x.Id != hsReportsAdvisorId)
                .Select(x => x.Map() )
                .ToList();
                        
            var emailPool = _qaAdvisorRepository.GetById(hsReportsAdvisorId);

            if (emailPool != null)
            {
                
                advisors.Add(emailPool.Map());
            }
            return advisors;

        }

        [HttpPost]
        public void Post(QaAdvisorViewModel model)
        {
            try
            {
                var advisor = _qaAdvisorRepository.GetById(model.Id);
                if (advisor == null)
                {
                    QaAdvisor.Create(model.Forename, model.Surname, model.Email);
                }
                else
                {
                    advisor.Update(model.Forename, model.Surname, model.Email, model.InRotation);
                }

                advisor.InRotation = model.InRotation;

                _qaAdvisorRepository.SaveOrUpdate(advisor);

            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(QaAdvisorController)).Error(ex);
                throw;
            }


        }

        [HttpGet]
        public QaAdvisorViewModel GetNextQaAdvisorInRotation()
        {
            try
            {
                return _qualityControlService.GetNextQaAdvisorInTheRotation().Map();
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(QaAdvisorController)).Error(ex);
                throw;
            }
        }

        [HttpGet]
        public QaAdvisorViewModel GetPreviousQaAdvisorInRotation()
        {
            try
            {
                return _qualityControlService.GetPreviousQaAdvisorInRotation().Map();
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(QaAdvisorController)).Error(ex);
                throw;
            }
        }


    }

}
