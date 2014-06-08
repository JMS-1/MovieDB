using System;
using System.Data.Entity;
using System.Data.Entity.Core.Objects;
using System.Linq;
using NUnit.Framework;
using WebApp.Models;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Der Rundumschlag um sicherzustellen, dass wir auch die richtigen Testdaten verwenden.
    /// </summary>
    [TestFixture]
    public class ValidateSampleDatabase : SampleDatabaseTestBase
    {
        /// <summary>
        /// Prüft die Anzahl aller Entitäten.
        /// </summary>
        [Test]
        public void ValidateAllCounts()
        {
            Assert.AreEqual( 7725, TestContext.Recordings.Count(), "#recordings" );
            Assert.AreEqual( 102, TestContext.Containers.Count(), "#containers" );
            Assert.AreEqual( 13, TestContext.Languages.Count(), "#languages" );
            Assert.AreEqual( 2847, TestContext.Stores.Count(), "#stores" );
            Assert.AreEqual( 526, TestContext.Series.Count(), "#series" );
            Assert.AreEqual( 23, TestContext.Genres.Count(), "#genres" );
            Assert.AreEqual( 0, TestContext.Links.Count(), "#links" );
        }

        /// <summary>
        /// Führ einige Stichproben auf die Seriennamen durch.
        /// </summary>
        [Test]
        public void CheckFullNamesOfSeries()
        {
            var series = TestContext.Series.Include( s => s.ParentSeries ).ToDictionary( s => s.FullName );

            for (var i = 0; i <= 11; i++)
                Assert.AreEqual( (i >= 1) && (i <= 10), series.ContainsKey( string.Format( "Smallville > Season {0:00}", i ) ), "{0}", i );
        }

        /// <summary>
        /// Prüft den Inhalt einer bestimmten Serie.
        /// </summary>
        [Test]
        public void CheckSeriesContent()
        {
            var series =
                TestContext
                    .Series
                    .Where( s => s.Name == "Series 04" )
                    .Where( s => s.ParentSeries.Name == "Confidential" )
                    .Where( s => s.ParentSeries.ParentSeries.Name == "Doctor Who" )
                    .Where( s => s.ParentSeries.ParentSeries.ParentSeries == null );

            var recordings =
                TestContext
                    .Recordings
                    .Join( series, r => r.SeriesIdentifier, s => s.Identifier, ( r, s ) => r )
                    .Include( r => r.Languages )
                    .Include( r => r.Genres )
                    .OrderBy( r => r.FullName )
                    .Skip( 1 )
                    .Take( 12 )
                    .ToArray();

            Assert.AreEqual( 12, recordings.Length, "#recordings" );
            Assert.AreEqual( "05 Sontar-Ha", recordings[4].Title, "title" );
            Assert.AreEqual( "Doctor Who > Confidential > Series 04 > 05 Sontar-Ha", recordings[4].FullName, "full name" );
        }
    }
}
