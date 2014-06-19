using System;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using NUnit.Framework;
using WebApp.Models;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft den Umgang mit der Tabelle der physikalischen Medien.
    /// </summary>
    [TestFixture]
    public class MediaTableTests : DatabaseTestBase
    {
        /// <summary>
        /// Liest alle Medien ein.
        /// </summary>
        [Test]
        public void CanReadMedia()
        {
            TestContext.Stores.ToArray();
        }

        /// <summary>
        /// Liest alle Medien mit Aufbewahrungsinformation ein.
        /// </summary>
        [Test]
        public void CanReadMediaWithContainer()
        {
            TestContext.Stores.Include( m => m.Container ).ToArray();
        }

        /// <summary>
        /// Die eindeutige Kennung muss eindeutig sein.
        /// </summary>
        [Test, ExpectedException( typeof( DbUpdateException ) )]
        public void IdentifierMustBeUnique()
        {
            var id = Guid.NewGuid();

            TestContext.Stores.Add( new Store { UniqueIdentifier = id, Location = "A1", Type = StoreType.DVD } );
            TestContext.Stores.Add( new Store { UniqueIdentifier = id, Location = "B1", Type = StoreType.DVD } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Unterschiedliche Aufbewahrung können die selben Werte für Ablageorte verwenden.
        /// </summary>
        [Test]
        public void PositionCanBeSameForDifferentContainers()
        {
            var container1 = TestContext.Containers.Add( new Container { Name = "A4", Type = ContainerType.Shelf } );
            var container2 = TestContext.Containers.Add( new Container { Name = "B4", Type = ContainerType.Shelf } );

            TestContext.Stores.Add( new Store { Location = "A4", Type = StoreType.DVD, Container = container1 } );
            TestContext.Stores.Add( new Store { Location = "A4", Type = StoreType.DVD, Container = container2 } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Position darf maximal 100 Zeichen haben.
        /// </summary>
        [Test]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void PositionIsLimitedTo100Charaters()
        {
            TestContext.Stores.Add( new Store { Location = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", Type = StoreType.DVD } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Position ist optional.
        /// </summary>
        /// <param name="longName">Der Name für den Test.</param>
        [Test]
        public void PositionIsOptional()
        {
            TestContext.Stores.Add( new Store { Type = StoreType.DVD } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Das Löschen der Aufbewahrung führt nicht zu einem kaskadierenden Löschen.
        /// </summary>
        [Test]
        public void DeletingTheContainerJustResetsTheReference()
        {
            var container = TestContext.Containers.Add( new Container { Name = "A2", Type = ContainerType.Box } );
            var media = TestContext.Stores.Add( new Store { Type = StoreType.DVD, Location = "1L", Container = container } ).UniqueIdentifier;

            TestContext.SaveChanges();

            Recreate();

            var retest = TestContext.Stores.AsNoTracking().Include( m => m.Container ).Single( m => m.UniqueIdentifier == media );

            Assert.IsNotNull( retest.Container, "before" );
            Assert.AreEqual( "A2", retest.Container.Name, "before ContainerName" );
            Assert.AreEqual( "1L", retest.Location, "before Location" );

            TestContext.Entry( new Container { UniqueIdentifier = container.UniqueIdentifier } ).State = EntityState.Deleted;
            TestContext.SaveChanges();

            Recreate();

            retest = TestContext.Stores.AsNoTracking().Include( m => m.Container ).Single( m => m.UniqueIdentifier == media );

            Assert.IsNull( retest.Container, "after" );
            Assert.IsNull( retest.Container, "after ContainerName" );
            Assert.AreEqual( "1L", retest.Location, "after Location" );

        }
    }
}
