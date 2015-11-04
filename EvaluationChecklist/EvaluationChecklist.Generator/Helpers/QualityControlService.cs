using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BusinessSafe.Data.Queries.SafeCheck;
using BusinessSafe.Domain.Common;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.Entities.SafeCheck;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using BusinessSafe.Messages.Emails.Commands;
using EvaluationChecklist.ClientDetails;
using NServiceBus;
using Checklist = BusinessSafe.Domain.Entities.SafeCheck.Checklist;


namespace EvaluationChecklist.Helpers
{
    public interface IQualityControlService
    {
        void AutoAssignChecklist(Checklist checklist);
        bool DoesChecklistNeedToBeChecked(Checklist checklist);
        QaAdvisor GetNextQaAdvisorInTheRotation();
        QaAdvisor GetNextQaAdvisorInTheRotation(QaAdvisor precedingQaAdvisor);
        QaAdvisor GetPreviousQaAdvisorInRotation();
        void UpdateLastQaAdvisorAssigned(QaAdvisor qaAdvisor);
        void AssignChecklistToQaAdvisor(Checklist checklist, QaAdvisor qaAdvisor);
        QaAdvisor GetHSReportsAdvisor();

        FavouriteChecklist GetFavouriteChecklist(Guid checklistId, string user, bool deleted);
        void MarkChecklistAsFavourite(FavouriteChecklist checklist);

        void MarkChecklistAsFavourite(FavouriteChecklist checklist, UserForAuditing userForAuditing);

        void UnMarkChecklistAsFavourite(Checklist checklist, string user, UserForAuditing userForAuditing);

        IList<FavouriteChecklist> SearchFavouritesChecklists(string user);

    }

    public class QualityControlService : IQualityControlService
    {
        const string HSReportsAdvisorId = "3A204FB3-1956-4EFC-BE34-89F7897570DB";
        private readonly IBus _bus;
        private readonly IClientDetailsService _clientDetailsService;
        private readonly IConsultantRepository _consultantRepo;
        private readonly IGetCompleteChecklistsQuery _getCompleteChecklistQuery;
        private readonly IQaAdvisorRepository _qaAdvisorRepository;
        private readonly IRepository<LastQaAdvisorAssigned, int> _lastQaAdvisorAssignedRepository;
        private readonly IFavouriteChecklistRepository _favouriteChecklistRepository;


        public QualityControlService(IDependencyFactory dependencyFactory)
		{
		    _bus = dependencyFactory.GetInstance<IBus>();
            _clientDetailsService = dependencyFactory.GetInstance<IClientDetailsService>();
            _consultantRepo = dependencyFactory.GetInstance<IConsultantRepository>();
            _getCompleteChecklistQuery = dependencyFactory.GetInstance<IGetCompleteChecklistsQuery>();
            _qaAdvisorRepository = dependencyFactory.GetInstance<IQaAdvisorRepository>();
            _lastQaAdvisorAssignedRepository = dependencyFactory.GetInstance<IRepository<LastQaAdvisorAssigned, int>>();
            _favouriteChecklistRepository = dependencyFactory.GetInstance<IFavouriteChecklistRepository>();
		}

        public bool DoesChecklistNeedToBeChecked(Checklist checklist)
        {
            if ( checklist.Status == Checklist.STATUS_COMPLETED 
                && !String.IsNullOrEmpty( checklist.ChecklistCreatedBy)
                && checklist.QaAdvisor == null ){

                var consultant = _consultantRepo.GetByFullname(checklist.ChecklistCreatedBy);

                if (consultant == null)
                {
                    return false;
                }

                if (checklist.SpecialReport && consultant.PercentageOfChecklistsToSendToQualityControl != 100)
                {
                    return false;
                }

                var consultantCompletedCount = _getCompleteChecklistQuery.Count(checklist.ChecklistCreatedBy);
                var nthChecklistToSendToQualityControl = consultant.PercentageOfChecklistsToSendToQualityControl == 0 ? 0 : 100 / consultant.PercentageOfChecklistsToSendToQualityControl;

                //if nthChecklistToSendToQualityControl == 1 then this means send every checklist to quality control;
                return  nthChecklistToSendToQualityControl == 1 || consultantCompletedCount > 0 && nthChecklistToSendToQualityControl > 0 && consultantCompletedCount % nthChecklistToSendToQualityControl == 0;
            }
           
            return false;
        }

        public void AutoAssignChecklist(Checklist checklist)
        {
            if (checklist.Status == Checklist.STATUS_COMPLETED
                && !String.IsNullOrEmpty(checklist.ChecklistCreatedBy)
                && checklist.QaAdvisor == null)
            {
                if (DoesChecklistNeedToBeChecked(checklist))
                {
                    // add QAassigned check here 
                    QaAdvisor qaAdvisor = null;

                    var consultant = _consultantRepo.GetByFullname(checklist.ChecklistCompletedBy);
                    bool updateLastQaAdvisorAssignedRequired = (consultant != null) && !consultant.QaAdvisorAssigned.HasValue;
                    
                    if (consultant == null)
                    {
                        qaAdvisor = GetNextQaAdvisorInTheRotation();
                    }
                    else
                    {
                        qaAdvisor = consultant.QaAdvisorAssigned.HasValue ? _qaAdvisorRepository.GetById(consultant.QaAdvisorAssigned.Value) : GetNextQaAdvisorInTheRotation();    
                    }
                   

                    if (qaAdvisor != null)
                    {
                        AssignChecklistToQaAdvisor(checklist, qaAdvisor);

                        // do not update lastQaAdvisor list if consultant has a one-to-one relation with Advisor
                        if (updateLastQaAdvisorAssignedRequired)
                        {
                            UpdateLastQaAdvisorAssigned(qaAdvisor);    
                        }
                    }                   
                }
                else
                {
                    //assign to default hs & reports team
                    var qaAdvisor = GetHSReportsAdvisor();
                    AssignChecklistToQaAdvisor(checklist, qaAdvisor);
                }
            }
        }

        public QaAdvisor GetNextQaAdvisorInTheRotation()
        {
            var lastQaAdvisorList = _lastQaAdvisorAssignedRepository.GetAll();

            if (lastQaAdvisorList.Count() == 0)
            {
                return _qaAdvisorRepository.GetAll()
                    .Where(x => x.Deleted == false && x.InRotation == true)
                    .OrderBy(x => x.Forename)
                    .ThenBy(x => x.Surname)
                    .FirstOrDefault();
            }
            else
            {
                return GetNextQaAdvisorInTheRotation(lastQaAdvisorList.First().QaAdvisor);
            }

            return null;
        }
        
        /// <summary>
        /// returns the next qaAdvisor in the rotation after the specified qaAdvisor
        /// </summary>
        /// <param name="precedingQaAdvisor"></param>
        /// <returns></returns>
        public QaAdvisor GetNextQaAdvisorInTheRotation(QaAdvisor precedingQaAdvisor)
        {
            var orderNumber = 1;
            var orderedAdvisors = _qaAdvisorRepository.GetAll()
                    .OrderBy(x => x.Forename)
                    .ThenBy(x => x.Surname)
                    .Select(x => new {QaAdvisor = x, OrderNumber = orderNumber++})
                    .ToList();

            var positionOfQaAdvisor = orderedAdvisors.First(x => x.QaAdvisor.Id == precedingQaAdvisor.Id).OrderNumber;

            var nextQaAdvisor = orderedAdvisors
                    .Where(x => x.OrderNumber > positionOfQaAdvisor)
                    .Where(x => !x.QaAdvisor.Deleted && x.QaAdvisor.InRotation)
                    .OrderBy(x => x.OrderNumber)
                    .FirstOrDefault();

            //if we are at the end of the list then we need to return to the start

            if (nextQaAdvisor != null)
            {
                return nextQaAdvisor.QaAdvisor;
            }
            else
            {
                return orderedAdvisors.FirstOrDefault(x => !x.QaAdvisor.Deleted && x.QaAdvisor.InRotation) !=null ? orderedAdvisors.FirstOrDefault(x => !x.QaAdvisor.Deleted && x.QaAdvisor.InRotation).QaAdvisor: null;
            }
             

        }

        public QaAdvisor GetPreviousQaAdvisorInRotation()
        {
            var lastQaAdvisorList = _lastQaAdvisorAssignedRepository.GetAll();

            if (lastQaAdvisorList.Any())
            {
                return lastQaAdvisorList.FirstOrDefault().QaAdvisor;
            }

            return null;
        }

        public void UpdateLastQaAdvisorAssigned(QaAdvisor qaAdvisor)
        {
            var nextQaAdvisorList = _lastQaAdvisorAssignedRepository.GetAll();

            var nextQaAdvisor = nextQaAdvisorList.Count() == 0 ? new LastQaAdvisorAssigned() { Id = 1 } : nextQaAdvisorList.First();
            nextQaAdvisor.QaAdvisor = qaAdvisor;

            _lastQaAdvisorAssignedRepository.SaveOrUpdate(nextQaAdvisor);
        }

        public void AssignChecklistToQaAdvisor(Checklist checklist, QaAdvisor qaAdvisor)
        {
            if (checklist.Status == Checklist.STATUS_SUBMITTED)
                return;

            if (checklist.QaAdvisor == null)
            {
                checklist.QaAdvisorAssignedOn = DateTime.Now;
            }

            checklist.QaAdvisor = qaAdvisor;
            checklist.Status = Checklist.STATUS_ASSIGNED;


            var sendChecklistAssignedEmail = new SendChecklistAssignedEmail
            {
                ChecklistId = checklist.Id,
                AssignedToId = qaAdvisor.Id
            };

            if (checklist.ClientId.HasValue)
            {
                var clientDetail = _clientDetailsService.Get(checklist.ClientId.Value);

                var site = checklist.SiteId.HasValue
                    ? _clientDetailsService.GetSite(checklist.ClientId.Value, checklist.SiteId.Value)
                    : null;

                var postcode = site != null ? site.Postcode : "";

                sendChecklistAssignedEmail.Can = clientDetail.CAN;
                sendChecklistAssignedEmail.SiteName = site != null ? site.SiteName : "";
                sendChecklistAssignedEmail.Address1 = site != null ? site.Address1 : "";
                sendChecklistAssignedEmail.Address2 = site != null ? site.Address2 : "";
                sendChecklistAssignedEmail.Address3 = site != null ? site.Address3 : "";
                sendChecklistAssignedEmail.Address4 = site != null ? site.Address4 : "";
                sendChecklistAssignedEmail.Address5 = site != null ? site.Address5 : "";
                sendChecklistAssignedEmail.Postcode = postcode;
            }
            else
            {
                sendChecklistAssignedEmail.Can = "Not specified";
                sendChecklistAssignedEmail.Postcode = "Not specified";
            }

            _bus.Send(sendChecklistAssignedEmail);
        }

        public QaAdvisor GetHSReportsAdvisor()
        {
            var hsReportsAdvisorId = Guid.Parse(HSReportsAdvisorId);
            return _qaAdvisorRepository.GetById(hsReportsAdvisorId);
        }

        public FavouriteChecklist GetFavouriteChecklist(Guid checklistId, string user, bool deleted)
        {
            return _favouriteChecklistRepository.Get(checklistId, user, deleted);
        }

        public void MarkChecklistAsFavourite(FavouriteChecklist checklist)
        {
            _favouriteChecklistRepository.SaveOrUpdate(checklist);
        }

        public void MarkChecklistAsFavourite(FavouriteChecklist checklist, UserForAuditing userForAuditing)
        {
            checklist.ReinstateFromDelete(userForAuditing);
            _favouriteChecklistRepository.SaveOrUpdate(checklist);
        }

        public void UnMarkChecklistAsFavourite(Checklist checklist, string user, UserForAuditing userForAuditing)
        {
            var favChecklist = _favouriteChecklistRepository.Get(checklist.Id, user);

            if (favChecklist != null)
            {
                favChecklist.MarkForDelete(userForAuditing);
                _favouriteChecklistRepository.SaveOrUpdate(favChecklist);    
            }
            
        }

        public IList<FavouriteChecklist> SearchFavouritesChecklists(string user)
        {
            var favChecklist = _favouriteChecklistRepository.GetByUser(user, false)
                .Where(fc => fc.Checklist.Deleted == false);

            return favChecklist.ToList();
        }
    }
}