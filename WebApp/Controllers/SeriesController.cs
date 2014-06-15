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
        public SeriesEditInfo Find( string identifier )
        {
            // Find the one
            var series = Database.Series.Find( new Guid( identifier ) );

            // Report
            if (series == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // See how many recordings are using it
            var users = Database.Recordings.Where( r => r.SeriesIdentifier == series.Identifier ).Count();
            var children = Database.Series.Where( s => s.ParentIdentifier == series.Identifier ).Count();

            // Create
            return SeriesEditInfo.Create( series, users, children );
        }
    }
}