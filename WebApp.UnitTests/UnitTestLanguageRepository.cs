using System;
using System.Linq;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.Tests
{
    public class UnitTestLanguageRepository : ILanguageRepository
    {
        private readonly Language[] m_languages = { };

        private UnitTestLanguageRepository()
        {
        }

        public static UnitTestLanguageRepository Create()
        {
            return new UnitTestLanguageRepository();
        }

        public Language Add( Language newEntity )
        {
            throw new NotImplementedException( "Add" );
        }

        public IQueryable<Language> Query()
        {
            return m_languages.AsQueryable();
        }
    }
}
