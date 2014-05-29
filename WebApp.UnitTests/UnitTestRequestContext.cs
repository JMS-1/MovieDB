using System.Threading.Tasks;
using WebApp.DAL;


namespace WebApp.Tests
{
    public class UnitTestRequestContext : IRequestContext
    {
        private UnitTestRequestContext( ILanguageRepository languages, IRecordingRepository recordings, IGenreRepository genres, IContainerRepository containers )
        {
            Genres = genres;
            Languages = languages;
            Recordings = recordings;
            Containers = containers;
        }

        public static UnitTestRequestContext Create( ILanguageRepository languages = null, IRecordingRepository recordings = null, IGenreRepository genres = null, IContainerRepository containers = null )
        {
            return
                new UnitTestRequestContext
                    (
                        languages ?? UnitTestLanguageRepository.Create(),
                        recordings ?? UnitTestRecordingRepository.Create(),
                        genres ?? UnitTestGenreRepository.Create(),
                        containers ?? UnitTestContainerRepository.Create()
                    );
        }

        public ILanguageRepository Languages { get; private set; }

        public IGenreRepository Genres { get; private set; }

        public IRecordingRepository Recordings { get; private set; }

        public IContainerRepository Containers { get; private set; }

        public Task<int> BeginSave()
        {
            throw new System.NotImplementedException( "BeginSave" );
        }
    }
}
