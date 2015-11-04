using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel;
using System.ServiceModel.Channels;
using System.Web;
using BusinessSafe.Domain.Entities;
using BusinessSafe.Domain.RepositoryContracts;
using BusinessSafe.Domain.RepositoryContracts.SafeCheck;
using EvaluationChecklist.ClientDocumentService;
using EvaluationChecklist.SecurityService;

namespace EvaluationChecklist.Helpers
{
    public interface IChecklistService
    {
        Guid CopyToSiteWithoutResponses(Guid checklistId, int siteId, int clientId, string copiedByName, bool isClone);
        Guid CopyToSiteWithResponses(Guid checklistId, int siteId, int clientId, string copiedByName, bool isClone);
        bool CanRevertChecklist(Guid checklistId);
        void RevertChecklist(Guid checklistId, UserForAuditing user, string postedBy);
    }

    public class ChecklistService: IChecklistService
    {
        private readonly ICheckListRepository _checklistRepository;
        private readonly IUserForAuditingRepository _userForAuditingRepository;
        private readonly IClientDocumentationChecklistPdfWriter _clientDocumentationChecklistPdfWriter;

        public ChecklistService(IDependencyFactory dependencyFactory)
        {
            _checklistRepository = dependencyFactory.GetInstance<ICheckListRepository>();
            _userForAuditingRepository = dependencyFactory.GetInstance<IUserForAuditingRepository>();
            _clientDocumentationChecklistPdfWriter = dependencyFactory.GetInstance<IClientDocumentationChecklistPdfWriter>();
        }
  

        public Guid CopyToSiteWithoutResponses(Guid checklistId, int siteId, int clientId, string copiedByName, bool isClone)
        {
            var checklist = _checklistRepository.GetById(checklistId);

            if (checklist == null)
            {
                throw new Exception("Checklist not found");
            }
            var user = _userForAuditingRepository.GetSystemUser();
            var newChecklist = checklist.CopyToSiteWithoutResponses(siteId, clientId, user, copiedByName, isClone);

            _checklistRepository.Save(newChecklist);

            return newChecklist.Id;
        }

        public Guid CopyToSiteWithResponses(Guid checklistId, int siteId, int clientId, string copiedByName, bool isClone)
        {
            var checklist = _checklistRepository.GetById(checklistId);

            if (checklist == null)
            {
                throw new Exception("Checklist not found");
            }
            var user = _userForAuditingRepository.GetSystemUser();
            var newChecklist = checklist.CopyToSiteWithResponses(siteId, clientId, user, copiedByName, isClone);

            _checklistRepository.Save(newChecklist);

            return newChecklist.Id;
        }

        public bool CanRevertChecklist(Guid checklistId)
        {
            var checklist = _checklistRepository.GetById(checklistId);

            if (checklist == null)
            {
                throw new Exception("Checklist not found");
            }

            return checklist.CanBeReverted();
        }

        public void RevertChecklist(Guid checklistId, UserForAuditing user, string postedBy)
        {
            var checklist = _checklistRepository.GetById(checklistId);

            if (checklist == null)
            {
                throw new Exception("Checklist not found");
            }

            var executiveSummaryDocumentLibraryId = checklist.ExecutiveSummaryDocumentLibraryId;

            checklist.Revert(user, postedBy);
            _checklistRepository.SaveOrUpdate(checklist);
            _checklistRepository.Flush();
            
            //Deletes the relevent executive summary documents
            if (executiveSummaryDocumentLibraryId.HasValue)
            {
                _clientDocumentationChecklistPdfWriter.DeleteFromClientDocumentation(executiveSummaryDocumentLibraryId.Value);
            }
        }
        
        
    }
}