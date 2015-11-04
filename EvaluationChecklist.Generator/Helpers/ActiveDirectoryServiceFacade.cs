using EvaluationChecklist.Controllers;
using Peninsula.Security.ActiveDirectory;

namespace EvaluationChecklist.Helpers
{
    public class ActiveDirectoryServiceFacade: IActiveDirectoryService
    {
        private readonly Peninsula.Security.ActiveDirectory.ActiveDirectoryService _activeDirectoryService;

        public ActiveDirectoryServiceFacade()
        {
            _activeDirectoryService = new ActiveDirectoryService("HQ", "DC=hq,DC=peninsula-uk,DC=local", @"hq\veritas", "is74rb80pk52");
        }

        public bool DoesUserExist(string username)
        {
            return _activeDirectoryService.DoesUserExist(username);
        }

        public User GetUser(string username)
        {
            //using the search method instead of the get method because the former returns the email address 
            return _activeDirectoryService.SearchUsersByUsername(username)[0];
        }

    }
}