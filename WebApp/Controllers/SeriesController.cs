using System;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web.Http;
using WebApp.DAL;
using WebApp.DTO;
using WebApp.Models;


namespace WebApp.Controllers
{
    /// <summary>
    /// Die Schnittstelle auf die Liste der Series.
    /// </summary>
    [RoutePrefix( "movie/series" )]
    public class SeriesController : ControllerWithDatabase
    {
        /// <summary>
        /// Ermittelt eine einzelne Serie.
        /// </summary>
        /// <param name="identifier">Die eindeutige Kennung der Serie.</param>
        /// <returns>Die gewünschte Serie.</returns>
        [Route( "{identifier}" )]
        [HttpGet]
        public SeriesEditInfo Find( Guid identifier )
        {
            // Find the one
            var series = Database.Series.Find( identifier );

            // Report
            if (series == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // See how many recordings are using it
            var users = Database.Recordings.Where( r => r.SeriesIdentifier == series.Identifier ).Count();
            var children = Database.Series.Where( s => s.ParentIdentifier == series.Identifier ).Count();

            // Create
            return SeriesEditInfo.Create( series, users, children );
        }

        /// <summary>
        /// Legt eine neue Serie an.
        /// </summary>
        /// <param name="newSeries">Die Daten zur Serie.</param>
        [Route( "" )]
        [HttpPost]
        public async Task<IHttpActionResult> Create( [FromBody] SeriesEdit newSeries )
        {
            // Add to collection
            Database.Series.Add( new Series { Name = newSeries.Name, Description = newSeries.Description, ParentIdentifier = newSeries.ParentIdentifier } );

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Verändert eine bestehende Serie.
        /// </summary>
        /// <param name="identifier">Die eindeutige Kennung der Serie.</param>
        /// <param name="newData">Die neuen Daten für die Serie.</param>
        [Route( "{identifier}" )]
        [HttpPut]
        public async Task<IHttpActionResult> Update( Guid identifier, [FromBody] SeriesEdit newData )
        {
            // Locate
            var series = Database.Series.Find( identifier );

            // Update
            series.Name = newData.Name;
            series.Description = newData.Description;
            series.ParentIdentifier = newData.ParentIdentifier;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Entfernt eine bestehende Art.
        /// </summary>
        /// <param name="identifier">Die eindeutige Kennung der Serie.</param>
        [Route( "{identifier}" )]
        [HttpDelete]
        public async Task<IHttpActionResult> Delete( Guid identifier )
        {
            // Mark as deleted
            Database.Entry<Series>( new Series { Identifier = identifier } ).State = EntityState.Deleted;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }
    }
}