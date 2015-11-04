using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.ServiceModel;
using System.ServiceModel.Channels;
using System.Web;
using EvaluationChecklist.ClientDocumentService;
using EvaluationChecklist.SecurityService;
using BusinessSafe.Infrastructure.Security;

namespace EvaluationChecklist.Helpers
{
    public class ClientDocumentationChecklistPdfWriter : IClientDocumentationChecklistPdfWriter
    {
        private const string _holdingPath = @"\\pbsw23datastore\DragonDropHoldingPath\";
        private const string _username = "Network.Monitor";
        private const string _domain = "HQ";
        private const string _encryptedPassword = "WBS9CNrr1YzIFNRx8Wtx5tZ7UsIs5jgV4yBuP3nAFuM=";
        private const string _uploadPathKey = "DocumentUploadHoldingPath";
        private readonly IImpersonator _impersonator;

        public ClientDocumentationChecklistPdfWriter(IImpersonator impersonator)
        {
            _impersonator = impersonator;
        }

        public long WriteToClientDocumentation(string fileName, byte[] pdfBytes, int clientId, long? siteId)
        {
            long documentID = 0;

            var fullFileName = _holdingPath + Guid.NewGuid();
            try
            {
                _impersonator.ImpersonateValidUser(_username, _domain, _encryptedPassword);
                File.WriteAllBytes(fullFileName, pdfBytes);
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                _impersonator.Dispose();
            }

            using(var securityService = new SecurityServiceClient())
            using (new OperationContextScope(securityService.InnerChannel))
            {
                OperationContext.Current.OutgoingMessageHeaders.Add(MessageHeader.CreateHeader("Username", "Peninsula.Common", "SafeCheckUser"));
                securityService.EnsureUserExists(null);
            }

            using(var clientDocumentService = new ClientDocumentServiceClient())
            using (new OperationContextScope(clientDocumentService.InnerChannel))
            {
                OperationContext.Current.OutgoingMessageHeaders.Add(MessageHeader.CreateHeader("Username", "Peninsula.Common", "SafeCheckUser"));

                var createClientDocumentRequest = new CreateClientDocumentRequest()
                                                      {
                                                          ClientId = clientId,
                                                          DocumentTypeId = 131, //MAGIC NUMBER: refactor out
                                                          OriginalFilename = fileName,
                                                          PhysicalFilePath = fullFileName,
                                                          Title = fileName,
                                                          SiteId = siteId
                                                      };
                
                documentID = clientDocumentService.CreateDocument(createClientDocumentRequest);
            }

            File.Delete(fullFileName);

            return documentID;
        }

        public void DeleteFromClientDocumentation(long documentId)
        {
            try
            {
                _impersonator.ImpersonateValidUser(_username, _domain, _encryptedPassword);
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                _impersonator.Dispose();
            }

            using (var securityService = new SecurityServiceClient())
            using (new OperationContextScope(securityService.InnerChannel))
            {
                OperationContext.Current.OutgoingMessageHeaders.Add(MessageHeader.CreateHeader("Username", "Peninsula.Common", "SafeCheckUser"));
                securityService.EnsureUserExists(null);
            }

            using (var clientDocumentService = new ClientDocumentServiceClient())
            using (new OperationContextScope(clientDocumentService.InnerChannel))
            {
                OperationContext.Current.OutgoingMessageHeaders.Add(MessageHeader.CreateHeader("Username", "Peninsula.Common", "SafeCheckUser"));
                
                var doc = clientDocumentService.GetById(documentId);
                
                if (doc.Deleted == false)
                {
                    long[] documentIds = { documentId };
                    clientDocumentService.DeleteByIds(documentIds);    
                }
            }
        }
    }
}