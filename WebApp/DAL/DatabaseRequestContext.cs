using System;
using System.Data.Entity.Validation;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;


namespace WebApp.DAL
{
    /// <summary>
    /// Abstrahiert den Zugriff auf die Datenbank so, dass eine Nutzung aus der Testumgebung
    /// heraus vereinfacht wird.
    /// </summary>
    public interface IRequestContext
    {
        /// <summary>
        /// Die Verwaltung der Tonspuren.
        /// </summary>
        ILanguageRepository Languages { get; }

        /// <summary>
        /// Die Verwaltung der Aufnahmen.
        /// </summary>
        IRecordingRepository Recordings { get; }

        /// <summary>
        /// Die Verwaltung der Arten von Aufnahmen.
        /// </summary>
        IGenreRepository Genres { get; }

        /// <summary>
        /// Die Verwaltung der Aufbewahrungen.
        /// </summary>
        IContainerRepository Containers { get; }

        /// <summary>
        /// Beginnt das Abspeichern von Veränderungen.
        /// </summary>
        /// <returns>Die Steuereinheit für den Speichervorgang.</returns>
        Task<int> BeginSave();
    }

    /// <summary>
    /// Implementiert den Zugriff auf die echte Datenbank.
    /// </summary>
    internal class DatabaseRequestContext : IRequestContext, IDisposable
    {
        /// <summary>
        /// Die eigentliche Datenbank.
        /// </summary>
        private Database m_database;

        /// <summary>
        /// Die eigentliche Datenbank.
        /// </summary>
        public Database Database
        {
            get
            {
                if (m_database == null)
                    m_database = new Database();

                return m_database;
            }
        }

        /// <summary>
        /// Alle Tonspuren.
        /// </summary>
        private ILanguageRepository m_languages;

        /// <summary>
        /// Alle Tonspuren.
        /// </summary>
        public ILanguageRepository Languages
        {
            get
            {
                if (m_languages == null)
                    m_languages = new LanguageRepository( Database );

                return m_languages;
            }
        }

        /// <summary>
        /// Alle Aufnahmen.
        /// </summary>
        private IRecordingRepository m_recordings;

        /// <summary>
        /// Alle Aufnahmen.
        /// </summary>
        public IRecordingRepository Recordings
        {
            get
            {
                if (m_recordings == null)
                    m_recordings = new RecordingRepository( Database );

                return m_recordings;
            }
        }

        /// <summary>
        /// Die Verwaltung der Arten von Aufnahmen.
        /// </summary>
        private IGenreRepository m_genres;

        /// <summary>
        /// Die Verwaltung der Arten von Aufnahmen.
        /// </summary>
        public IGenreRepository Genres
        {
            get
            {
                if (m_genres == null)
                    m_genres = new GenreRepository( Database );

                return m_genres;
            }
        }

        /// <summary>
        /// Die Verwaltung der Aufbewahrungen.
        /// </summary>
        private IContainerRepository m_containers;

        /// <summary>
        /// Die Verwaltung der Aufbewahrungen.
        /// </summary>
        public IContainerRepository Containers
        {
            get
            {
                if (m_containers == null)
                    m_containers = new ContainerRepository( Database );

                return m_containers;
            }
        }

        /// <summary>
        /// Beendet diesen Zugriff auf die Datenbank endgültig.
        /// </summary>
        public void Dispose()
        {
            // Proper cleanup of underlying context
            using (Interlocked.Exchange( ref m_database, null ))
            {
                m_containers = null;
                m_recordings = null;
                m_languages = null;
                m_genres = null;
            }
        }

        /// <summary>
        /// Beginnt die Übernahme von Veränderungen in die persistente Ablage.
        /// </summary>
        /// <returns>Die Steuereinheit für den Speichervorgang.</returns>
        public Task<int> BeginSave()
        {
            try
            {
                return Database.SaveChangesAsync();
            }
            catch (DbEntityValidationException e)
            {
                foreach (var error in e.EntityValidationErrors)
                    Trace.TraceError( string.Format( "{0}: {1}", error.Entry.Entity, string.Join( ", ", error.ValidationErrors.Select( ve => ve.ErrorMessage ) ) ) );

                throw;
            }
        }
    }
}