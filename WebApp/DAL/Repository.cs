using System;
using System.Data.Entity;
using System.Linq;


namespace WebApp.DAL
{
    /// <summary>
    /// Die Schnittstelle zur Verwaltung von Entitäten einer bestimmten Art.
    /// </summary>
    /// <typeparam name="TEntityType">Die Art der Entität.</typeparam>
    public interface IRepository<TEntityType> where TEntityType : class
    {
        /// <summary>
        /// Meldet eine Suche über alle Entitäten.
        /// </summary>
        /// <returns>Die gewünschte Suche.</returns>
        IQueryable<TEntityType> Query();

        /// <summary>
        /// Ergänzt eine Entität.
        /// </summary>
        /// <param name="newEntity">Die neue Entität.</param>
        /// <returns>Die neue Entität.</returns>
        TEntityType Add( TEntityType newEntity );
    }

    /// <summary>
    /// Verwaltet die Entitäten einer bestimmten Art in der Datenbank.
    /// </summary>
    /// <typeparam name="TEntityType"></typeparam>
    internal abstract class Repository<TEntityType> : IRepository<TEntityType> where TEntityType : class
    {
        /// <summary>
        /// Die Art der Entität.
        /// </summary>
        protected readonly Database Database;

        /// <summary>
        /// Initialisiert eine neue Verwaltung.
        /// </summary>
        /// <param name="database">Die zu verwendende Datenbank.</param>
        protected Repository( Database database )
        {
            if (database == null)
                throw new ArgumentException( "keine Datenbank angegeben", "database" );

            Database = database;
        }

        /// <summary>
        /// Ermittelt alle Entitäten der gewünschten Art in der Datenbank.
        /// </summary>
        protected abstract DbSet<TEntityType> All { get; }

        /// <summary>
        /// Meldet alle Entitäte der passenden Art in der Datenbank.
        /// </summary>
        protected virtual IQueryable<TEntityType> StandardQuery { get { return All; } }

        /// <summary>
        /// Meldet alle Entitäte der passenden Art in der Datenbank.
        /// </summary>
        /// <returns>Eine neue Suche.</returns>
        public IQueryable<TEntityType> Query() { return StandardQuery; }

        /// <summary>
        /// Ergänzt eine neue Entität.
        /// </summary>
        /// <param name="newEntity">Die neue Entität.</param>
        /// <returns>Die neue Entität.</returns>
        public TEntityType Add( TEntityType newEntity )
        {
            return All.Add( newEntity );
        }
    }
}