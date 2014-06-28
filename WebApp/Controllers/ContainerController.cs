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
    /// Die Schnittstelle auf die Liste der Aufbewahrungen.
    /// </summary>
    [RoutePrefix( "movie/container" )]
    public class ContainerController : ControllerWithDatabase
    {
        /// <summary>
        /// Ermittelt eine einzelne Aufbewahrung.
        /// </summary>
        /// <param name="identifier">Der eindeutige Name der Aufbewahrung.</param>
        /// <returns>Die gewünschte Aufbewahrung.</returns>
        [Route( "{identifier}" )]
        [HttpGet]
        public ContainerEditInfo Find( Guid identifier )
        {
            // Find the one
            var container = Database.Containers.Find( identifier );
            if (container == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // Helper
            var children =
                Database
                    .Containers
                    .Where( c => c.ParentIdentifier == container.UniqueIdentifier )
                    .OrderBy( c => c.Name );
            var recordings =
                Database
                    .Recordings
                    .Include( r => r.Store )
                    .Include( r => r.Series )
                    .Where( r => r.Store.ContainerIdentifier == container.UniqueIdentifier )
                    .OrderBy( r => r.Series.FullName )
                    .ThenBy( r => r.Name );

            // Construct
            return ContainerEditInfo.Create( container, children, recordings );
        }

        /// <summary>
        /// Legt eine neue Aufbewahrung an.
        /// </summary>
        /// <param name="newGenre">Die Daten zur Aufbewahrung.</param>
        [Route( "" )]
        [HttpPost]
        public async Task<IHttpActionResult> Create( [FromBody] ContainerEdit newContainer )
        {
            // Add to collection
            Database.Containers.Add( new Container
            {
                ParentIdentifier = newContainer.ParentContainer,
                Description = newContainer.Description,
                Location = newContainer.ParentLocation,
                Type = newContainer.ContainerType,
                Name = newContainer.Name,
            } );

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Verändert eine bestehende Aufbewahrung.
        /// </summary>
        /// <param name="identifier">Der eindeutige Name der Aufbewahrung.</param>
        /// <param name="newData">Die neuen Daten für die Aufbewahrung.</param>
        [Route( "{identifier}" )]
        [HttpPut]
        public async Task<IHttpActionResult> Update( Guid identifier, [FromBody] ContainerEdit newData )
        {
            // Locate
            var container = Database.Containers.Find( identifier );
            if (container == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // Update
            container.ParentIdentifier = newData.ParentContainer;
            container.Description = newData.Description;
            container.Location = newData.ParentLocation;
            container.Type = newData.ContainerType;
            container.Name = newData.Name;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Entfernt eine existierende Aufbewahrung.
        /// </summary>
        /// <param name="identifier">Der eindeutige Name der Aufbewahrung.</param>
        [Route( "{identifier}" )]
        [HttpDelete]
        public async Task<IHttpActionResult> Delete( Guid identifier )
        {
            // Mark as deleted
            Database.Entry( new Container { UniqueIdentifier = identifier } ).State = EntityState.Deleted;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }
    }
}