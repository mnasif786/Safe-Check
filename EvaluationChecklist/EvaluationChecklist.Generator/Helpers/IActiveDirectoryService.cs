namespace EvaluationChecklist.Helpers
{
    public interface IActiveDirectoryService
    {
        bool DoesUserExist(string username);
        Peninsula.Security.ActiveDirectory.User GetUser(string username);
    }
}