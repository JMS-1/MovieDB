using System.Linq;
using System.Web.Http;
using WebApp.DAL;
using WebApp.Models;


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
            var info = new ApplicationInformation { NumberOfRecordings = Database.Recordings.Count() };

            // If there are recordings there is no need to do a full check - regular operation mode optimized!
            if (info.NumberOfRecordings < 1)
                info.DatabaseIsEmpty = Database.IsEmpty;

            return info;
        }
    }
}
