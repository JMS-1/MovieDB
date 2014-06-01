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

            TestContext.Stores.Add( new Store { Identifier = id, Location = "A1", Type = StoreType.DVD } );
            TestContext.Stores.Add( new Store { Identifier = id, Location = "B1", Type = StoreType.DVD } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Ein Ablageort muss für jede Aufbewahrung eindeutig sein.
        /// </summary>
        /// <param name="containerName">Der Name der Aufbewahrung.</param>
        [TestCase( null )]
        [TestCase( "A3" )]
        [ExpectedException( typeof( DbUpdateException ) )]
        public void PositionMustBeUniquePerContainer( string containerName )
        {
            var container = string.IsNullOrEmpty( containerName ) ? null : TestContext.Containers.Add( new Container { Name = containerName, Type = ContainerType.Shelf } );

            TestContext.Stores.Add( new Store { Location = "A3", Type = StoreType.DVD, Container = container } );
            TestContext.Stores.Add( new Store { Location = "A3", Type = StoreType.DVD, Container = container } );
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
        /// Die Beschreibung muss gesetzt sein und zwischen 1 und 100 Zeichen haben.
        /// </summary>
        /// <param name="longName">Der Name für den Test.</param>
        [TestCase( null )]
        [TestCase( "" )]
        [TestCase( "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1" )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void PositionMustHaveBetween1And100Charaters( string longName )
        {
            TestContext.Stores.Add( new Store { Location = longName, Type = StoreType.DVD } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Das Löschen der Aufbewahrung führt nicht zu einem kaskadierenden Löschen.
        /// </summary>
        [Test]
        public void DeletingTheContainerJustResetsTheReference()
        {
            var container = TestContext.Containers.Add( new Container { Name = "A2", Type = ContainerType.Box } );
            var media = TestContext.Stores.Add( new Store { Type = StoreType.DVD, Location = "1L", Container = container } ).Identifier;

            TestContext.SaveChanges();

            Recreate();

            var retest = TestContext.Stores.AsNoTracking().Include( m => m.Container ).Single( m => m.Identifier == media );

            Assert.IsNotNull( retest.Container, "before" );
            Assert.AreEqual( "A2", retest.ContainerName, "before ContainerName" );
            Assert.AreEqual( "1L", retest.Location, "before Location" );

            TestContext.Entry( new Container { Name = "A2" } ).State = EntityState.Deleted;
            TestContext.SaveChanges();

            Recreate();

            retest = TestContext.Stores.AsNoTracking().Include( m => m.Container ).Single( m => m.Identifier == media );

            Assert.IsNull( retest.Container, "after" );
            Assert.IsNull( retest.ContainerName, "after ContainerName" );
            Assert.AreEqual( "1L", retest.Location, "after Location" );

        }
    }
}
