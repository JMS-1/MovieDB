using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using NUnit.Framework;
using WebApp.Models;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft den Umgang mit der Tabelle der Aufbewahrungen.
    /// </summary>
    [TestFixture]
    public class ContainerTableTests : DatabaseTestBase
    {
        /// <summary>
        /// Liest alle Aufbewahrungen ein.
        /// </summary>
        [Test]
        public void CanReadContainers()
        {
            TestContext.Containers.ToArray();
        }

        /// <summary>
        /// Liest alle Aufbewahrungen mit einer Ebene der Hierarchie ein.
        /// </summary>
        [Test]
        public void CanReadContainersWithParent()
        {
            TestContext.Containers.Include( c => c.ParentContainer ).ToArray();
        }

        /// <summary>
        /// Es ist möglich, weitere Aufbewahrungen zu ergänzen.
        /// </summary>
        [Test]
        public void CanAddContainer()
        {
            TestContext.Containers.Add(
                new Container
                {
                    Description = "test description",
                    Type = ContainerType.Box,
                    Name = "test",
                } );

            TestContext.SaveChanges();

            Recreate();

            var container = TestContext.Containers.Find( "test" );

            Assert.IsNotNull( container, "id" );
            Assert.AreEqual( "test", container.Name, "Name" );
            Assert.AreEqual( "test description", container.Description, "Description" );
            Assert.AreEqual( ContainerType.Box, container.Type, "Type" );
        }

        /// <summary>
        /// Der Name muss eindeutig sein.
        /// </summary>
        [Test, ExpectedException( typeof( DbUpdateException ) )]
        public void NameMustBeUnique()
        {
            TestContext.Containers.Add( new Container { Name = "A1", Description = "A1", Type = ContainerType.FeatureSet } );
            TestContext.Containers.Add( new Container { Name = "A1", Description = "B1", Type = ContainerType.Shelf } );
            TestContext.SaveChanges();
        }


        /// <summary>
        /// Die Beschreibung einer Aufbewahrung muss nicht eindeutig sein.
        /// </summary>
        [Test]
        public void DescriptionCanBeUsedMultipleTimes()
        {
            TestContext.Containers.Add( new Container { Name = "A2", Description = "A2", Type = ContainerType.Box } );
            TestContext.Containers.Add( new Container { Name = "B2", Description = "A2", Type = ContainerType.FeatureSet } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Name muss gesetzt sein und gewissen Einschränkungen genügen.
        /// </summary>
        /// <param name="titleLength">Die Länge des Namens.</param>
        [TestCase( -1 )]
        [TestCase( 0 )]
        [TestCase( 51 )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void NameMustBeSetAndRespectLengthLimits( int titleLength )
        {
            var title = (titleLength < 0) ? null : new string( 'x', titleLength );

            TestContext.Containers.Add( new Container { Name = title, Description = "A3", Type = ContainerType.Box } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung ist optional.
        /// </summary>
        [Test]
        public void DescriptionIsOptionalAndLimitedTo2000Characters()
        {
            TestContext.Containers.Add( new Container { Name = "A4", Description = null, Type = ContainerType.Box } );
            TestContext.Containers.Add( new Container { Name = "B4", Description = string.Empty, Type = ContainerType.Box } );
            TestContext.Containers.Add( new Container { Name = "C4", Description = new string( 'A', 2000 ), Type = ContainerType.Box } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung kann nicht mehr als 2000 Zeichen haben.
        /// </summary>
        [Test, ExpectedException( typeof( DbEntityValidationException ) )]
        public void DescriptionIsLimitedTo2000Characters()
        {
            TestContext.Containers.Add( new Container { Name = "A5", Description = new string( 'A', 2001 ), Type = ContainerType.Box } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Es ist möglich eine ganze Familie von Aufbewahrungen zu erzeugen.
        /// </summary>
        [Test]
        public void CanCreateFamily()
        {
            var containers = TestContext.Containers;

            var grandpa = containers.Add( new Container { Name = "grand", Type = ContainerType.Box, ParentContainer = null } );
            var parent1 = containers.Add( new Container { Name = "parent 1", Type = ContainerType.Box, ParentContainer = grandpa } );
            var parent2 = containers.Add( new Container { Name = "parent 2", Type = ContainerType.Box, ParentContainer = grandpa } );
            var child1 = containers.Add( new Container { Name = "child 1 of parent 1", Type = ContainerType.Box, ParentContainer = parent1 } );
            var child2 = containers.Add( new Container { Name = "child 2 of parent 1", Type = ContainerType.Box, ParentContainer = parent1 } );
            var child3 = containers.Add( new Container { Name = "child 1 of parent 2", Type = ContainerType.Box, ParentContainer = parent2 } );

            TestContext.SaveChanges();

            Recreate();

            var all = TestContext.Containers.ToDictionary( c => c.Name );

            Assert.IsNull( all["grand"].ParentContainer, "grand" );
            Assert.AreSame( all["grand"], all["parent 1"].ParentContainer, "parent 1" );
            Assert.AreSame( all["grand"], all["parent 2"].ParentContainer, "parent 2" );
            Assert.AreSame( all["parent 1"], all["child 1 of parent 1"].ParentContainer, "child 1 of 1" );
            Assert.AreSame( all["parent 1"], all["child 2 of parent 1"].ParentContainer, "child 2 of 1" );
            Assert.AreSame( all["parent 2"], all["child 1 of parent 2"].ParentContainer, "child 1 of 2" );
        }

        /// <summary>
        /// Das Löschen einer Aufbewahrung setzt die Referenz auf die übergeordnete Aufbewahrung zurück.
        /// </summary>
        [Test]
        public void DeleteResetsParent()
        {
            var containers = TestContext.Containers;

            var inner = containers.Add( new Container { Name = "inner", Type = ContainerType.Box, ParentContainer = null } );
            var outer = containers.Add( new Container { Name = "outer", Type = ContainerType.Box, ParentContainer = inner, Location = "somewhere" } );

            TestContext.SaveChanges();

            Recreate();

            var retest = TestContext.Containers.AsNoTracking().Include( c => c.ParentContainer ).Single( c => c.Name == "outer" );

            Assert.IsNotNull( retest.ParentContainer, "before" );
            Assert.AreEqual( "inner", retest.ParentName, "before ParentName" );
            Assert.AreEqual( "somewhere", retest.Location, "before Location" );

            var delete = new Container { Name = "inner" };

            TestContext.Entry( delete ).State = EntityState.Deleted;

            TestContext.SaveChanges();

            Recreate();

            retest = TestContext.Containers.Include( c => c.ParentContainer ).Single( c => c.Name == "outer" );

            Assert.IsNull( retest.ParentContainer, "after" );
            Assert.IsNull( retest.ParentName, "after ParentName" );
            Assert.IsNull( retest.Location, "after Location" );
        }
    }
}
