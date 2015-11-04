namespace EvaluationChecklist.Helpers
{
    public interface IClientDocumentationChecklistPdfWriter
    {
        long WriteToClientDocumentation(string fileName, byte[] pdfBytes, int clientId, long? siteId);

        void DeleteFromClientDocumentation(long documentId);
    }
}