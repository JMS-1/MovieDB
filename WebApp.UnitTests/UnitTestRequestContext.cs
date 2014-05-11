using System.Threading.Tasks;
using WebApp.DAL;


namespace WebApp.Tests
{
    public class UnitTestRequestContext : IRequestContext
    {
        private UnitTestRequestContext( ILanguageRepository languages, IRecordingRepository recordings )
        {
            Languages = languages;
            Recordings = recordings;
        }

        public static UnitTestRequestContext Create( ILanguageRepository languages = null, IRecordingRepository recordings = null )
        {
            return new UnitTestRequestContext( languages ?? LanguageRepositoryMock.Create(), recordings ?? RecordingRepositoryMock.Create() );
        }

        public ILanguageRepository Languages { get; private set; }

        public IRecordingRepository Recordings { get; private set; }

        public Task<int> BeginSave()
        {
            throw new System.NotImplementedException( "BeginSave" );
        }
    }
}
