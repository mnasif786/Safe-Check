using System;
using System.IO;
using System.Net;
using System.Text;
using System.Web;
using System.Web.Http;
using RestSharp;
using log4net;

namespace EvaluationChecklist.Controllers
{
    public class SpellCheckController : ApiController
    {

        private static readonly ILog _logger = LogManager.GetLogger(typeof(SpellCheckController));

        /// <summary>
        /// Currently we are using the implementation of the spell checker web services at http://jquery-spellchecker.badsyntax.co/webservices/php/SpellChecker.php
        /// Ideally we would like a local version of spellchecker where we can use an English-UK but due to time constraints we haven't done this yet.
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        public object Post(SpellCheckRequest value)
        {
            //I tried using rest client to do this but it doesn't let you to post form encoded
            //I tried httpClient but it appends following format to the http body driver+=pspell. Note the +. Why?
            var req = WebRequest.Create(new Uri("http://jquery-spellchecker.badsyntax.co/webservices/php/SpellChecker.php")) as HttpWebRequest;
            req.Method = "POST";
            req.ContentType = "application/x-www-form-urlencoded";

            // Encode the parameters as form data:
            var bodyFormEncoded = "";

            switch (value.action)
            {
                default:
                case "get_suggestions":
                    bodyFormEncoded = string.Format("lang={0}&driver={1}&action={2}&word={3}", value.lang, value.driver, value.action, HttpUtility.UrlEncode(value.word));
                    break;
                case "get_incorrect_words":
                    bodyFormEncoded = string.Format("lang={0}&driver={1}&action={2}&text%5B%5D={3}", value.lang, value.driver, value.action, HttpUtility.UrlEncode(value.text[0]));
                    break;

            }

            byte[] formData = UTF8Encoding.UTF8.GetBytes(bodyFormEncoded);
            req.ContentLength = formData.Length;



            try
            {
                // Send the request:
                using (Stream post = req.GetRequestStream())
                {
                    post.Write(formData, 0, formData.Length);
                }

                // Pick up the response:
                string result = null;
                using (HttpWebResponse resp = req.GetResponse()
                                              as HttpWebResponse)
                {
                    StreamReader reader = new StreamReader(resp.GetResponseStream());
                    result = reader.ReadToEnd(); //returns  a json string.
                }

                switch (value.action)
                {
                    default:
                    case "get_suggestions":
                        return SimpleJson.DeserializeObject<string[]>(result); ;
                        //return result;
                        break;
                    case "get_incorrect_words":

                        return SimpleJson.DeserializeObject<SpellCheckResult>(result); ;
                        break;

                }
 
            }
            catch(Exception ex)
            {
                _logger.Error(ex);
                _logger.Error(req.RequestUri.ToString());
                throw ex;
            }
        }

    }

    

    public class SpellCheckRequest
    {
        public string lang { get; set; }
        public string driver { get; set; }
        public string action { get; set; }
        public string[] text { get; set; }
        public string word { get; set; }
        

    }

    public class SpellCheckResult
    {
        public string outcome { get; set; }
        public string[][] data { get; set; }
     

    }



}
