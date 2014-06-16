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
        public GenreEditInfo Find( string name )
        {
            // Find the one
            var container = Database.Containers.Find( name );

            // Report
            if (container == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // Helper
            var children = Database.Containers.Where( c => c.ParentContainer.Name == container.Name ).OrderBy( c => c.Name ).ToArray();
            var recordings = Database.Recordings.Where( r => r.Store.ContainerName == container.Name ).OrderBy( r => r.FullName ).ToArray();

            return null;
        }
    }
}