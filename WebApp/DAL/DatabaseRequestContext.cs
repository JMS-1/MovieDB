using System;
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
        /// Beendet diesen Zugriff auf die Datenbank endgültig.
        /// </summary>
        public void Dispose()
        {
            // Proper cleanup of underlying context
            using (Interlocked.Exchange( ref m_database, null ))
            {
                m_recordings = null;
                m_languages = null;
            }
        }

        /// <summary>
        /// Beginnt die Übernahme von Veränderungen in die persistente Ablage.
        /// </summary>
        /// <returns>Die Steuereinheit für den Speichervorgang.</returns>
        public Task<int> BeginSave()
        {
            return Database.SaveChangesAsync();
        }
    }
}