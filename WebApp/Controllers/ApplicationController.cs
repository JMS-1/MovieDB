using System;
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
    public class ApplicationController : ApiController
    {
        /// <summary>
        /// Wir benötigen Zugriff auf die Datenbank.
        /// </summary>
        public IRequestContext DatabaseContext { get; private set; }

        /// <summary>
        /// Erzeugt für jeden Zugriff eine neue Instanz zum Zugriff auf die Daten.
        /// </summary>
        /// <param name="context">Abstraktion des Datenbankzugriffs.</param>
        /// <exception cref="ArgumentException">Auch in Testszenarien muss eine Datenbankabstraktion
        /// angegeben werden.</exception>
        public ApplicationController( IRequestContext context )
        {
            // Just in case we forget...
            if (context == null)
                throw new ArgumentException( "keine Datenbank", "context" );

            DatabaseContext = context;
        }

        /// <summary>
        /// Meldet einige Eckdaten zur Anwendung an sich.
        /// </summary>
        /// <returns>Die gewünschte Eckdaten.</returns>
        [Route( "info" )]
        [HttpGet]
        public ApplicationInformation GetInformation()
        {
            return
                new ApplicationInformation
                {
                    DatabaseIsEmpty = DatabaseContext.TestEmpty(),
                };
        }
    }
}
