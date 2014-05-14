using System.Data.Entity;
using WebApp.Models;


namespace WebApp.DAL
{
    /// <summary>
    /// Die Schnittstelle zur Verwaltung der Arten von Aufnahmen.
    /// </summary>
    public interface IGenreRepository : IRepository<Genre>
    {
    }

    /// <summary>
    /// Die Verwaltung der Aufnahmearten in der Datenbank.
    /// </summary>
    internal class GenreRepository : Repository<Genre>, IGenreRepository
    {
        /// <summary>
        /// Erstellt eine neue Verwaltung.
        /// </summary>
        /// <param name="database">Die zugehörige Datenbank.</param>
        public GenreRepository( Database database )
            : base( database )
        {
        }

        /// <summary>
        /// Meldet alle Aufnahmearten in der Datenbank.
        /// </summary>
        protected override DbSet<Genre> All { get { return Database.Genres; } }
    }
}