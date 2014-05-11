using System;
using System.Threading;
using System.Threading.Tasks;


namespace WebApp.DAL
{
    public interface IRequestContext
    {
        ILanguageRepository Languages { get; }

        IRecordingRepository Recordings { get; }

        Task<int> BeginSave();
    }

    public class DatabaseRequestContext : IRequestContext, IDisposable
    {
        private Database m_database;

        public Database Database
        {
            get
            {
                if (m_database == null)
                    m_database = new Database();

                return m_database;
            }
        }

        private ILanguageRepository m_languages;

        public ILanguageRepository Languages
        {
            get
            {
                if (m_languages == null)
                    m_languages = new LanguageRepository( Database );
                return m_languages;
            }
        }

        private IRecordingRepository m_recordings;

        public IRecordingRepository Recordings
        {
            get
            {
                if (m_recordings == null)
                    m_recordings = new RecordingRepository( Database );
                return m_recordings;
            }
        }

        public DatabaseRequestContext()
        {
        }

        public void Dispose()
        {
            using (Interlocked.Exchange( ref m_database, null ))
            {
                m_recordings = null;
                m_languages = null;
            }
        }

        public Task<int> BeginSave()
        {
            return Database.SaveChangesAsync();
        }
    }
}