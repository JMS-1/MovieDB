using System.Threading;
using System.Web.Http;
using WebApp.DAL;


namespace WebApp.Controllers
{
    /// <summary>
    /// Die Basisklasse für alle Web Dienste, die bei der Initalisierung eine Datenbankverbindung
    /// vorbereitet.
    /// </summary>
    public abstract class ControllerWithDatabase : ApiController
    {
        /// <summary>
        /// Die Datenbankverbindung.
        /// </summary>
        private Database m_database = new Database();

        /// <summary>
        /// Meldet die aktuelle Datenbank.
        /// </summary>
        protected Database Database { get { return m_database; } }

        /// <summary>
        /// Beendet die Nutzung dieses Dienstes endgültig.
        /// </summary>
        /// <param name="disposing">Gesetzt, wenn der Aufruf im normalen Programmfluss erfolgt - und
        /// nicht etwa im <i>Finalizer</i> von .NET.</param>
        protected override void Dispose( bool disposing )
        {
            if (disposing)
            {
                var database = Interlocked.Exchange( ref m_database, null );
                if (database != null)
                    database.Dispose();
            }

            base.Dispose( disposing );
        }
    }
}