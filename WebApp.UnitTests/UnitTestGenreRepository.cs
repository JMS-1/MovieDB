using System;
using System.Linq;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.Tests
{
    public class UnitTestGenreRepository : IGenreRepository
    {
        private readonly Genre[] m_genres = { };

        private UnitTestGenreRepository()
        {
        }

        public static UnitTestGenreRepository Create()
        {
            return new UnitTestGenreRepository();
        }

        public Genre Add( Genre newEntity )
        {
            throw new NotImplementedException( "Add" );
        }

        public IQueryable<Genre> Query()
        {
            return m_genres.AsQueryable();
        }
    }
}
