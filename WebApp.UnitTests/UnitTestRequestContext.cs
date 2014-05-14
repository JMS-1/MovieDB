using System.Threading.Tasks;
using WebApp.DAL;


namespace WebApp.Tests
{
    public class UnitTestRequestContext : IRequestContext
    {
        private UnitTestRequestContext( ILanguageRepository languages, IRecordingRepository recordings, IGenreRepository genres )
        {
            Genres = genres;
            Languages = languages;
            Recordings = recordings;
        }

        public static UnitTestRequestContext Create( ILanguageRepository languages = null, IRecordingRepository recordings = null, IGenreRepository genres = null )
        {
            return
                new UnitTestRequestContext
                    (
                        languages ?? UnitTestLanguageRepository.Create(),
                        recordings ?? UnitTestRecordingRepository.Create(),
                        genres ?? UnitTestGenreRepository.Create()
                    );
        }

        public ILanguageRepository Languages { get; private set; }

        public IGenreRepository Genres { get; private set; }

        public IRecordingRepository Recordings { get; private set; }

        public Task<int> BeginSave()
        {
            throw new System.NotImplementedException( "BeginSave" );
        }
    }
}
