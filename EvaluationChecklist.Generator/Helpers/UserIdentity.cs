using System.Globalization;
using System.Security.Principal;

namespace EvaluationChecklist.Helpers
{
    public class UserIdentity
    {
        private string _domain = "";
        private string _username = "";

        private string _firstname = "";
        private string _surname = "";
        private string _name = "";

        public string Domain { get { return _domain; } }
        public string Username { get { return _username; } }
        public string Firstname { get { return _firstname; } }
        public string Surname { get { return _surname; } }

        public string Name { get { return _name; } }

        public UserIdentity(string name)
        {
            _name = name;
        }

        public UserIdentity(IPrincipal userPrincipal)
        {
            _domain = userPrincipal.Identity.Name.Split('\\')[0];
            _username = userPrincipal.Identity.Name.Split('\\')[1];
            _firstname = CultureInfo.CurrentCulture.TextInfo.ToTitleCase(_username.Split('.')[0]);
            _surname = CultureInfo.CurrentCulture.TextInfo.ToTitleCase(_username.Split('.')[1]);
            _name = _firstname + " " + _surname;
        }
    }

    public interface IUserIdentityFactory
    {
        UserIdentity GetUserIdentity(IPrincipal userPrincipal);
    }

    public class UserIdentityFactory: IUserIdentityFactory
    {

        public UserIdentity GetUserIdentity(IPrincipal userPrincipal)
        {
            return new UserIdentity(userPrincipal);
        }

    }
}