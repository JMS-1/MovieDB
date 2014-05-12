using System.Data.Entity;
using WebApp.Models;


namespace WebApp.DAL
{
    /// <summary>
    /// Die Schnittstelle zur Verwaltung der Sprachen.
    /// </summary>
    public interface ILanguageRepository : IRepository<Language>
    {
    }

    /// <summary>
    /// Die Verwaltung der Sprachen in der Datenbank.
    /// </summary>
    internal class LanguageRepository : Repository<Language>, ILanguageRepository
    {
        /// <summary>
        /// Erstellt eine neue Verwaltung.
        /// </summary>
        /// <param name="database">Die zugehörige Datenbank.</param>
        public LanguageRepository( Database database )
            : base( database )
        {
        }

        /// <summary>
        /// Meldet alle Sprachen in der Datenbank.
        /// </summary>
        protected override DbSet<Language> All { get { return Database.Languages; } }
    }
}