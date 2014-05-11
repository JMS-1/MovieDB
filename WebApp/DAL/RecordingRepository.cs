using System.Data.Entity;
using System.Linq;
using WebApp.Models;


namespace WebApp.DAL
{
    public interface IRecordingRepository : IRepository<Recording>
    {
    }

    public class RecordingRepository : Repository<Recording>, IRecordingRepository
    {
        public RecordingRepository( Database database )
            : base( database )
        {
        }

        public override Recording Add( Recording newEntity )
        {
            return Database.Recordings.Add( newEntity );
        }

        protected override IQueryable<Recording> All
        {
            get
            {
                return
                    Database
                        .Recordings
                        .Include( recording => recording.Languages );
            }
        }
    }
}