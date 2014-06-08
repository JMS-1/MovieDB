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
    /// Prüft den Umgang mit der Tabelle der Serien.
    /// </summary>
    [TestFixture]
    public class SeriesTableTests : DatabaseTestBase
    {
        /// <summary>
        /// Liest alle Serien ein.
        /// </summary>
        [Test]
        public void CanReadSeries()
        {
            TestContext.Series.ToArray();
        }

        /// <summary>
        /// Liest alle Serien mit den direkt übergeordneten Serien.
        /// </summary>
        [Test]
        public void CanReadSeriesWithParent()
        {
            TestContext.Series.Include( c => c.ParentSeries ).ToArray();
        }

        /// <summary>
        /// Es ist möglich, weitere Serien zu ergänzen.
        /// </summary>
        [Test]
        public void CanAddSeries()
        {
            var id = TestContext.Series.Add(
                new Series
                {
                    Name = "theSeries",
                    Description = "description",
                } ).Identifier;

            TestContext.SaveChanges();

            Recreate();

            var series = TestContext.Series.Find( id );

            Assert.IsNotNull( series, "id" );
            Assert.AreEqual( "theSeries", series.Name, "Name" );
            Assert.AreEqual( "description", series.Description, "Description" );
        }

        /// <summary>
        /// Die eindeutige Kennung muss eindeutig sein.
        /// </summary>
        [Test, ExpectedException( typeof( DbUpdateException ) )]
        public void IdentifierMustBeUnique()
        {
            var id = Guid.NewGuid();

            TestContext.Series.Add( new Series { Identifier = id, Name = "A1", Description = "A1" } );
            TestContext.Series.Add( new Series { Identifier = id, Name = "A1", Description = "A2" } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Ein Name muss für alle Kinderserien eindeutig sein.
        /// </summary>
        /// <param name="seriesName">Der Name der Serie.</param>
        [TestCase( null )]
        [TestCase( "A2" )]
        [ExpectedException( typeof( DbUpdateException ) )]
        public void NameMustBeUniquePerParent( string seriesName )
        {
            var parent = string.IsNullOrEmpty( seriesName ) ? null : TestContext.Series.Add( new Series { Name = seriesName, Description = "A2" } );

            TestContext.Series.Add( new Series { Name = "B2", Description = "B2", ParentSeries = parent } );
            TestContext.Series.Add( new Series { Name = "B2", Description = "C2", ParentSeries = parent } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Unterschiedliche Serien können KInder mit gleichen Namen haben.
        /// </summary>
        [Test]
        public void NameCanBeSameForDifferentParents()
        {
            var parent1 = TestContext.Series.Add( new Series { Name = "A3", Description = "A3" } );
            var parent2 = TestContext.Series.Add( new Series { Name = "B3", Description = "B3" } );

            TestContext.Series.Add( new Series { Name = "C3", Description = "C3", ParentSeries = parent1 } );
            TestContext.Series.Add( new Series { Name = "C3", Description = "D3", ParentSeries = parent2 } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung einer Serie muss nicht eindeutig sein.
        /// </summary>
        [Test]
        public void DescriptionCanBeUsedMultipleTimes()
        {
            TestContext.Series.Add( new Series { Name = "A4", Description = "A4" } );
            TestContext.Series.Add( new Series { Name = "B4", Description = "A4" } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Name muss gesetzt sein und gewissen Einschränkungen genügen.
        /// </summary>
        /// <param name="nameLength">Die Länge des Namens.</param>
        [TestCase( -1 )]
        [TestCase( 0 )]
        [TestCase( 51 )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void NameMustBeSetAndRespectLengthLimits( int nameLength )
        {
            var title = (nameLength < 0) ? null : new string( 'x', nameLength );

            TestContext.Series.Add( new Series { Name = title, Description = "A5" } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung ist optional.
        /// </summary>
        [Test]
        public void DescriptionIsOptionalAndLimitedTo2000Characters()
        {
            TestContext.Series.Add( new Series { Name = "A6", Description = null } );
            TestContext.Series.Add( new Series { Name = "B6", Description = string.Empty } );
            TestContext.Series.Add( new Series { Name = "C6", Description = new string( 'A', 2000 ) } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung kann nicht mehr als 2000 Zeichen haben.
        /// </summary>
        [Test, ExpectedException( typeof( DbEntityValidationException ) )]
        public void DescriptionIsLimitedTo2000Characters()
        {
            TestContext.Series.Add( new Series { Name = "A7", Description = new string( 'A', 2001 ) } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Es ist möglich eine ganze Familie von Serien zu erzeugen.
        /// </summary>
        [Test]
        public void CanCreateFamily()
        {
            var series = TestContext.Series;

            var grandpa = series.Add( new Series { Name = "grand", ParentSeries = null } );
            var parent1 = series.Add( new Series { Name = "parent 1", ParentSeries = grandpa } );
            var parent2 = series.Add( new Series { Name = "parent 2", ParentSeries = grandpa } );
            var child1 = series.Add( new Series { Name = "child 1 of parent 1", ParentSeries = parent1 } );
            var child2 = series.Add( new Series { Name = "child 2 of parent 1", ParentSeries = parent1 } );
            var child3 = series.Add( new Series { Name = "child 1 of parent 2", ParentSeries = parent2 } );

            TestContext.SaveChanges();

            Recreate();

            var all = TestContext.Series.ToDictionary( c => c.Name );

            Assert.IsNull( all["grand"].ParentSeries, "grand" );
            Assert.AreSame( all["grand"], all["parent 1"].ParentSeries, "parent 1" );
            Assert.AreSame( all["grand"], all["parent 2"].ParentSeries, "parent 2" );
            Assert.AreSame( all["parent 1"], all["child 1 of parent 1"].ParentSeries, "child 1 of 1" );
            Assert.AreSame( all["parent 1"], all["child 2 of parent 1"].ParentSeries, "child 2 of 1" );
            Assert.AreSame( all["parent 2"], all["child 1 of parent 2"].ParentSeries, "child 1 of 2" );
        }

        /// <summary>
        /// Das Löschen einer Serie setzt die Referenz auf die übergeordnete Serie zurück.
        /// </summary>
        [Test]
        public void DeleteResetsParent()
        {
            var series = TestContext.Series;

            var inner = series.Add( new Series { Name = "inner", ParentSeries = null } );
            var outer = series.Add( new Series { Name = "outer", ParentSeries = inner } );
            var innerId = inner.Identifier;

            TestContext.SaveChanges();

            Recreate();

            var retest = TestContext.Series.AsNoTracking().Include( c => c.ParentSeries ).Single( c => c.Name == "outer" );

            Assert.IsNotNull( retest.ParentSeries, "before" );
            Assert.AreEqual( innerId, retest.ParentIdentifier, "before ParentName" );

            var delete = new Series { Identifier = innerId };

            TestContext.Entry( delete ).State = EntityState.Deleted;

            TestContext.SaveChanges();

            Recreate();

            retest = TestContext.Series.Include( c => c.ParentSeries ).Single( c => c.Name == "outer" );

            Assert.IsNull( retest.ParentSeries, "after" );
            Assert.IsNull( retest.ParentIdentifier, "after ParentName" );
        }
    }
}
