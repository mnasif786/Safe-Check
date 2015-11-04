using System;

namespace EvaluationChecklist.Helpers
{
    public static class NullableDateTimeExtensions
    {
        public static DateTime? ToUniversalTime(this DateTime? dateTime)
        {
            return dateTime.HasValue ? (DateTime?) dateTime.Value.ToUniversalTime() : null;
        }

        public static DateTime? ToLocalTime(this DateTime? dateTime)
        {
            return dateTime.HasValue ? (DateTime?)dateTime.Value.ToLocalTime() : null;
        }
    }
}