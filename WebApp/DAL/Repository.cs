using System;
using System.Linq;


namespace WebApp.DAL
{
    public interface IRepository<TEntityType> where TEntityType : class
    {
        IQueryable<TEntityType> Query();

        TEntityType Add( TEntityType newEntity );
    }

    public abstract class Repository<TEntityType> : IRepository<TEntityType> where TEntityType : class
    {
        protected readonly Database Database;

        protected Repository( Database database )
        {
            if (database == null)
                throw new ArgumentException( "keine Datenbank angegeben", "database" );

            Database = database;
        }

        protected abstract IQueryable<TEntityType> All { get; }

        public IQueryable<TEntityType> Query() { return All; }

        public abstract TEntityType Add( TEntityType newEntity );
    }
}