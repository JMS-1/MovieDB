using System;
using System.Linq;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.Tests
{
    public class LanguageRepositoryMock : ILanguageRepository
    {
        private readonly Language[] m_languages = { };

        private LanguageRepositoryMock()
        {
        }

        public static LanguageRepositoryMock Create()
        {
            return new LanguageRepositoryMock();
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
