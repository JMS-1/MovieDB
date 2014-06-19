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
    /// Die Schnittstelle auf die Liste der Arten von Aufzeichnungen.
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
        public GenreEditInfo Find( Guid identifier )
        {
            // Find the one
            var genre = Database.Genres.Find( identifier );

            // Report
            if (genre == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // See how many recordings are using it
            var users = Database.Recordings.Where( r => r.Genres.Any( g => g.UniqueIdentifier == genre.UniqueIdentifier ) ).Count();

            // Create
            return GenreEditInfo.Create( genre, users );
        }

        /// <summary>
        /// Legt eine neue Art an.
        /// </summary>
        /// <param name="newGenre">Die Daten zur Art.</param>
        [Route( "" )]
        [HttpPost]
        public async Task<IHttpActionResult> Create( [FromBody] GenreDescription newGenre )
        {
            // Add to collection
            Database.Genres.Add( new Genre { Name = newGenre.Description } );

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Verändert eine bestehende Art.
        /// </summary>
        /// <param name="identifier">Der eindeutige Name der Art.</param>
        /// <param name="newData">Die neuen Daten für die Art.</param>
        [Route( "{identifier}" )]
        [HttpPut]
        public async Task<IHttpActionResult> Update( Guid identifier, [FromBody] GenreDescription newData )
        {
            // Locate
            var genre = Database.Genres.Find( identifier );

            // Update
            genre.Name = newData.Description;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Entfernt eine bestehende Art.
        /// </summary>
        /// <param name="identifier">Der eindeutige Name der Art.</param>
        [Route( "{identifier}" )]
        [HttpDelete]
        public async Task<IHttpActionResult> Delete( Guid identifier )
        {
            // Mark as deleted
            Database.Entry( new Genre { UniqueIdentifier = identifier } ).State = EntityState.Deleted;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }
    }
}