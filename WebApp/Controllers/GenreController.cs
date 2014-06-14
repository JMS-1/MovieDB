using System;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Xml.Serialization;
using WebApp.DAL;
using WebApp.DTO;
using WebApp.Models;


namespace WebApp.Controllers
{
    /// <summary>
    /// Die Schnittstelle auf die Liste der Arten von Aufzeichnungen
    /// </summary>
    [RoutePrefix( "movie/genre" )]
    public class GenreController : ControllerWithDatabase
    {
        /// <summary>
        /// Ermittelt eine einzelne Art.
        /// </summary>
        /// <param name="identifier">Der eindeutige Name der Art.</param>
        /// <returns>Die gewünschte Art.</returns>
        [Route( "{identifier}" )]
        [HttpGet]
        public GenreEditInfo Find( string identifier )
        {
            // Find the one
            var genre = Database.Genres.Find( identifier );

            // Report
            if (genre == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // See how many recordings are using it
            var users = Database.Recordings.Where( r => r.Genres.Any( g => g.Name == genre.Name ) ).Count();

            // Create
            return GenreEditInfo.Create( genre, users );
        }
    }
}