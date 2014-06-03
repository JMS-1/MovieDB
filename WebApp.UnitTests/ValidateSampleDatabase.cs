﻿using System.Linq;
using NUnit.Framework;


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
    }
}
