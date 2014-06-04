using System.Data.Entity;
using System.Linq;
using System.Web.Http;
using WebApp.DAL;
using WebApp.DTO;


namespace WebApp.Controllers
{
    /// <summary>
    /// Diese Schnittstelle liefert einige Informationen, die entweder gar nicht oder nur am Rande
    /// mit den in der Datenbank abgelegten Entitäten zu tun hat.
    /// </summary>
    [RoutePrefix( "movie" )]
    public class ApplicationController : ControllerWithDatabase
    {
        /// <summary>
        /// Meldet einige Eckdaten zur Anwendung an sich.
        /// </summary>
        /// <returns>Die gewünschte Eckdaten.</returns>
        [Route( "info" )]
        [HttpGet]
        public ApplicationInformation GetInformation()
        {
            var info =
                new ApplicationInformation
                {
                    Series = Database.Series.OrderBy( s => s.NameMapping.HierarchicalName ).Include( s => s.ParentSeries ).Include( s => s.NameMapping ).Select( SeriesDescription.Create ).ToArray(),
                    Languages = Database.Languages.OrderBy( l => l.Description ).Select( LanguageDescription.Create ).ToArray(),
                    Genres = Database.Genres.OrderBy( g => g.Description ).Select( GenreDescription.Create ).ToArray(),
                    NumberOfRecordings = Database.Recordings.Count(),
                };

            // If there are recordings there is no need to do a full check - regular operation mode optimized!
            if (info.NumberOfRecordings < 1)
                info.DatabaseIsEmpty = Database.IsEmpty;

            return info;
        }
    }
}
