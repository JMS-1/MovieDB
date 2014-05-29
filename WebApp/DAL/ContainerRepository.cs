using System.Data.Entity;
using WebApp.Models;


namespace WebApp.DAL
{
    /// <summary>
    /// Die Schnittstelle zur Verwaltung der Aufbewahrungen.
    /// </summary>
    public interface IContainerRepository : IRepository<Container>
    {
    }

    /// <summary>
    /// Die Verwaltung der Aufbewahrungen.
    /// </summary>
    internal class ContainerRepository : Repository<Container>, IContainerRepository
    {
        /// <summary>
        /// Erstellt eine neue Verwaltung.
        /// </summary>
        /// <param name="database">Die zugehörige Datenbank.</param>
        public ContainerRepository( Database database )
            : base( database )
        {
        }

        /// <summary>
        /// Meldet alle Aufbewahrungen in der Datenbank.
        /// </summary>
        protected override DbSet<Container> All { get { return Database.Containers; } }
    }
}