using System.Data.Entity;
using System.Linq;
using WebApp.Models;


namespace WebApp.DAL
{
    /// <summary>
    /// Die Schnittstelle zur Verwaltung der Aufnahmen.
    /// </summary>
    public interface IRecordingRepository : IRepository<Recording>
    {
    }

    /// <summary>
    /// Die Verwaltung der Aufnahmen in der Datenbank.
    /// </summary>
    internal class RecordingRepository : Repository<Recording>, IRecordingRepository
    {
        /// <summary>
        /// Erstellt eine neue Verwaltung für Aufnahmen.
        /// </summary>
        /// <param name="database">Die zu verwendende Datenbank.</param>
        public RecordingRepository( Database database )
            : base( database )
        {
        }

        /// <summary>
        /// Meldet alle Aufnahmen in der Datenbank.
        /// </summary>
        protected override IQueryable<Recording> StandardQuery { get { return All; } }

        /// <summary>
        /// Meldet alle Aufnahmen in der Datenbank.
        /// </summary>
        protected override DbSet<Recording> All { get { return Database.Recordings; } }
    }
}