using System;

namespace EvaluationChecklist.Models
{
    public class FavouriteChecklistViewModel
    {
        public Guid Id { get; set; }

        public Guid ChecklistId { get; set; }

        public string User { get; set; }

        public string Title { get; set; }

    }

    public class FavouriteChecklistRequestViewModel
    {
        public Guid ChecklistId { get; set; }

        public string Title { get; set; }

    }

    public class FavouriteChecklistSearchResultViewModel
    {
        public Guid Id { get; set; }

        public Guid ChecklistId { get; set; }

        public string MarkedByUser { get; set; }

        public string TemplateName { get; set; }

        public string CAN { get; set; }

        public string Postcode { get; set; }

        public string Status { get; set; }

        public string Title { get; set; }

        public SiteViewModel Site { get; set; }

        public DateTime? StatusDate { get; set; }

    }
}