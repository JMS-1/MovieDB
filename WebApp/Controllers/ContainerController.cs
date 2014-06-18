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
        /// <param name="name">Der eindeutige Name der Aufbewahrung.</param>
        /// <returns>Die gewünschte Aufbewahrung.</returns>
        [Route( "" )]
        [HttpGet]
        public ContainerEditInfo Find( string name )
        {
            // Find the one
            var container = Database.Containers.Find( name );

            // Report
            if (container == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // Helper
            var children =
                Database
                    .Containers
                    .Where( c => c.ParentContainer.Name == container.Name )
                    .OrderBy( c => c.Name );
            var recordings =
                Database
                    .Recordings
                    .Include( r => r.Store )
                    .Where( r => r.Store.ContainerName == container.Name )
                    .OrderBy( r => r.FullName );

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
                ParentName = newContainer.ParentContainerName,
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
        [Route( "" )]
        [HttpPut]
        public async Task<IHttpActionResult> Update( string name, [FromBody] ContainerEdit newData )
        {
            // Locate
            var container = Database.Containers.Find( name );

            // Update
            container.ParentName = newData.ParentContainerName;
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
        /// <param name="name">Der eindeutige Name der Aufbewahrung.</param>
        [Route( "" )]
        [HttpDelete]
        public async Task<IHttpActionResult> Delete( string name )
        {
            // Mark as deleted
            Database.Entry<Container>( new Container { Name = name } ).State = EntityState.Deleted;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }
    }
}