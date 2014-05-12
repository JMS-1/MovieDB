using System;
using System.Linq;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.Tests
{
    public class UnitTestRecordingRepository : IRecordingRepository
    {
        private readonly Recording[] m_recordings = { };

        private UnitTestRecordingRepository()
        {
        }

        public static UnitTestRecordingRepository Create()
        {
            return new UnitTestRecordingRepository();
        }

        public Recording Add( Recording newEntity )
        {
            throw new NotImplementedException( "Add" );
        }

        public IQueryable<Recording> Query()
        {
            return m_recordings.AsQueryable();
        }
    }
}
