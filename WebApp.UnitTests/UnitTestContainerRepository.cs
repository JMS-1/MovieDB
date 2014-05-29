using System;
using System.Linq;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.Tests
{
    public class UnitTestContainerRepository : IContainerRepository
    {
        private readonly Container[] m_containers = { };

        private UnitTestContainerRepository()
        {
        }

        public static UnitTestContainerRepository Create()
        {
            return new UnitTestContainerRepository();
        }

        public Container Add( Container newEntity )
        {
            throw new NotImplementedException( "Add" );
        }

        public IQueryable<Container> Query()
        {
            return m_containers.AsQueryable();
        }
    }
}
