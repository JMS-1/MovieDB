using System;
using System.Linq;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.Tests
{
    public class UnitTestContainerReferenceRepository : IContainerReferenceRepository
    {
        private readonly ContainerReference[] m_containerReferences = { };

        private UnitTestContainerReferenceRepository()
        {
        }

        public static UnitTestContainerReferenceRepository Create()
        {
            return new UnitTestContainerReferenceRepository();
        }

        public ContainerReference Add( ContainerReference newEntity )
        {
            throw new NotImplementedException( "Add" );
        }

        public IQueryable<ContainerReference> Query()
        {
            return m_containerReferences.AsQueryable();
        }
    }
}
