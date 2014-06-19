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
    /// Die Schnittstelle auf die Liste der Sprachen.
    /// </summary>
    [RoutePrefix( "movie/language" )]
    public class LanguageController : ControllerWithDatabase
    {
        /// <summary>
        /// Ermittelt eine Sprache.
        /// </summary>
        /// <param name="identifier">Das eindeutige Kürzel der Sprache.</param>
        /// <returns>Die gewünschte Sprache.</returns>
        [Route( "{identifier}" )]
        [HttpGet]
        public LanguageEditInfo Find( Guid identifier )
        {
            // Find the one
            var language = Database.Languages.Find( identifier );

            // Report
            if (language == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // See how many recordings are using it
            var users = Database.Recordings.Where( r => r.Languages.Any( l => l.UniqueIdentifier == language.UniqueIdentifier ) ).Count();

            // Create
            return LanguageEditInfo.Create( language, users );
        }

        /// <summary>
        /// Legt eine neue Sprache an.
        /// </summary>
        /// <param name="newLanguage">Die Daten zur Sprache.</param>
        [Route( "" )]
        [HttpPost]
        public async Task<IHttpActionResult> Create( [FromBody] LanguageDescription newLanguage )
        {
            // Add to collection
            Database.Languages.Add( new Language { Description = newLanguage.Description } );

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Verändert eine bestehende Sprache.
        /// </summary>
        /// <param name="identifier">Das eindeutige Kürzel der Sprache.</param>
        /// <param name="newData">Die neuen Daten für die Sprache.</param>
        [Route( "{identifier}" )]
        [HttpPut]
        public async Task<IHttpActionResult> Update( Guid identifier, [FromBody] LanguageDescription newData )
        {
            // Locate
            var language = Database.Languages.Find( identifier );

            // Update
            language.Description = newData.Description;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Entfernt eine bestehende Sprache.
        /// </summary>
        /// <param name="identifier">Das eindeutige Kürzel der Sprache.</param>
        [Route( "{identifier}" )]
        [HttpDelete]
        public async Task<IHttpActionResult> Delete( Guid identifier )
        {
            // Mark as deleted
            Database.Entry<Language>( new Language { UniqueIdentifier = identifier } ).State = EntityState.Deleted;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();

        }
    }
}