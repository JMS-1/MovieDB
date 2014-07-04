using System;
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
            // All series known - without filling the navigation property!
            var allSeries = Database.Series.ToDictionary( s => s.UniqueIdentifier );

            // Lookup the full name of a series
            Func<Guid, string> getFullName = null;

            // Define the recursive lookup - since we load all series we can do the lookup on our own without having a JOIN on the database
            getFullName = seriesIdentifier =>
            {
                // Find the one
                var series = allSeries[seriesIdentifier];
                if (!series.ParentIdentifier.HasValue)
                    return series.Name;

                // Merge with parent
                return string.Format( "{0} {1} {2}", getFullName( series.ParentIdentifier.Value ), Models.Series.JoinCharacter, series.Name );
            };

            var info =
                new ApplicationInformation
                {
                    Series = allSeries.Values.Select( s => SeriesDescription.Create( s, getFullName ) ).OrderBy( s => s.FullName, StringComparer.InvariantCultureIgnoreCase ).ToArray(),
                    Containers = Database.Containers.OrderBy( c => c.Name ).Select( ContainerDescription.Create ).ToArray(),
                    Languages = Database.Languages.OrderBy( l => l.Name ).Select( LanguageDescription.Create ).ToArray(),
                    Genres = Database.Genres.OrderBy( g => g.Name ).Select( GenreDescription.Create ).ToArray(),
                    NumberOfRecordings = Database.Recordings.Count(),
                };

            // If there are recordings there is no need to do a full check - regular operation mode optimized!
            if (info.NumberOfRecordings < 1)
                info.DatabaseIsEmpty = Database.IsEmpty;

            return info;
        }
    }
}
