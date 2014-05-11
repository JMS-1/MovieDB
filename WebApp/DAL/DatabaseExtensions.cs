using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace WebApp.DAL
{
    public static class DatabaseExtensions
    {
        public static Task<List<TItemType>> ToListAsync<TItemType>( this IEnumerable<TItemType> items )
        {
            return Task.Run( () => items.ToList() );
        }
    }
}