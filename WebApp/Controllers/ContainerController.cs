using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web.Http;
using WebApp.DAL;
using WebApp.DTO;


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
    }
}