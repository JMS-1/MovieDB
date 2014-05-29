using System.Data.Entity;
using WebApp.Models;


namespace WebApp.DAL
{
    /// <summary>
    /// Die Schnittstelle zur Verwaltung der Referenzen auf Aufbewahrungen.
    /// </summary>
    public interface IContainerReferenceRepository : IRepository<ContainerReference>
    {
    }

    /// <summary>
    /// Die Verwaltung der Referenzen auf Aufbewahrungen.
    /// </summary>
    internal class ContainerReferenceRepository : Repository<ContainerReference>, IContainerReferenceRepository
    {
        /// <summary>
        /// Erstellt eine neue Verwaltung.
        /// </summary>
        /// <param name="database">Die zugehörige Datenbank.</param>
        public ContainerReferenceRepository( Database database )
            : base( database )
        {
        }

        /// <summary>
        /// Meldet alle Referenzen auf Aufbewahrungen.
        /// </summary>
        protected override DbSet<ContainerReference> All { get { return Database.ContainerReferences; } }
    }
}