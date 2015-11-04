using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using RestSharp;


namespace EvaluationChecklist.IntegrationTests
{
    public class BaseIntegrationTest
    {
        public BaseIntegrationTest()
        {
            HttpClient = new RestClient(Url.AbsoluteUri);
            HttpClient.Authenticator = new NtlmAuthenticator("continuous.int", "is74rb80pk52");
        }

        protected RestClient HttpClient;

        protected string ResourceUrl;

        protected const string ApiBaseUrl = "/api/";

        protected Guid ApiTestChecklistIdDoesNotExist
        {
            get { return Guid.NewGuid(); }
        }

        protected Uri Url
        {
            get { return new Uri(Settings1.Default.URL); }
        }

        protected Guid ApiTestChecklistId
        {
            get { return Guid.Parse("815E851A-B13F-CA14-A705-E755D2A66194"); }
        }

        protected int? ApiTestClientId
        {
            get { return 53749; }
        }

        protected int? APiTestSiteId
        {
            get { return 5576030; }
        }

        
        protected string ApiTestCoveringLetterContents
        {
            get { return "<p>This is covering letter contents</p>"; }
        }

    }
}
