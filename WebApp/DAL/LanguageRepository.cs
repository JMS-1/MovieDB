using System.Data.Entity;
using System.Linq;
using WebApp.Models;


namespace WebApp.DAL
{
    public interface ILanguageRepository : IRepository<Language>
    {
    }

    public class LanguageRepository : Repository<Language>, ILanguageRepository
    {
        public LanguageRepository( Database database )
            : base( database )
        {
        }

        protected override IQueryable<Language> All { get { return Database.Languages; } }

        public override Language Add( Language newEntity )
        {
            return Database.Languages.Add( newEntity );
        }
    }
}