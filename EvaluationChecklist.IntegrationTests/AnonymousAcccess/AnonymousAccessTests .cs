using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using NUnit.Framework;
using RestSharp;

namespace EvaluationChecklist.IntegrationTests.AnonymousAcccess
{
    [TestFixture]
    public class AnonymousAccessTests : BaseIntegrationTest
    {

        [TestCase("angular/components/tinymce.js")]
        [TestCase("angular/controllers/checklist.js")]
        [TestCase("angular/controllers/checklists.js")]
        [TestCase("angular/modules/app.js")]
        [TestCase("angular/partials/checklist.htm")]
        [TestCase("bootstrap/css/bootstrap-responsive.css")]
        [TestCase("bootstrap/img/icon-delete.png")]
        [TestCase("bootstrap/js/bootstrap.min.js")]
        [TestCase("content/angularjs/1.0.7/angular.min.js")]
        [TestCase("content/images/greenball.png")]
        [TestCase("content/jquery/1.10.2/jquery.min.js")]
        [TestCase("content/jqueryui/1.10.3/jquery-ui.min.js")]
        [TestCase("content/ie.css")]
        [TestCase("content/styles.css")]
        [TestCase("tinymce/js/tinymce/tinymce.min.js")]
        [TestCase("tinymce/js/tinymce/plugins/print/plugin.min.js")]
        [TestCase("print.htm")]
        [TestCase("angularmanifest.appcache")]
        [TestCase("index.htm")]
        [TestCase("angular/tests/specRunner.html")]
        public void Given_user_is_anonymous_when_accessing_code_file_then_file_downloaded(string filePath)
        {
            var webClient = new WebClient();

            var download = webClient.DownloadString(string.Format("{0}{1}", Url, filePath));

            Assert.That(download.Length, Is.GreaterThan(0));

        }

        [TestCase("help")]
        [TestCase("api/checklists/815E851A-B13F-CA14-A705-E755D2A66194")]
        [TestCase("account")]
        [TestCase("api/checklistsquery?clientAccountNumber=&checklistCreatedBy=&visitDate=&status=Assigned&includeDeleted=false&excludeSubmitted=false&statusFromDate=&statusToDate=")]
        [TestCase("api/impressions")]
        [TestCase("api/question/815E851A-B13F-CA14-A705-E755D2A66194")]
        [TestCase("api/categories")]
        [TestCase("api/clients/query/DEN101")]
        [TestCase("api/clients/12312/employees")]
        [TestCase("api/clients/12312")]
        [TestCase("api/industries")]
        [TestCase("api/checklistTemplate")]
        [TestCase("api/advisors")]
        [TestCase("api/consultants")]
        [TestCase("api/maintenanceuser")]
        public void Given_user_is_anonymous_when_accessing_api_then_unauthorised_exeception(string apiResourcePath)
        {
              // Given
            var request = new RestRequest(apiResourcePath);
            HttpClient.Authenticator = null;

            // When
            var response = HttpClient.Execute(request);

            // Then
            Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);

        }
    }
}
