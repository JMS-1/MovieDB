using System;
using System.Linq;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.Tests
{
    public class RecordingRepositoryMock : IRecordingRepository
    {
        private readonly Recording[] m_recordings = { };

        private RecordingRepositoryMock()
        {
        }

        public static RecordingRepositoryMock Create()
        {
            return new RecordingRepositoryMock();
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
