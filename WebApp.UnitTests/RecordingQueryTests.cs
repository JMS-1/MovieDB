using System;
using NUnit.Framework;
using WebApp.Controllers;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft den Zugriff auf die Suche nach Aufzeichnungen.
    /// </summary>
    [TestFixture]
    public class RecordingQueryTests : ControllerTestBase<MovieController>
    {
        /// <summary>
        /// Meldet das Ergebnis der Suche ohne Angabe von Parametern.
        /// </summary>
        [Test]
        public void InitialQuery()
        {
            var recordings = Controller.Query();

            Assert.AreEqual( 0, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 7725, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new Guid( "7b2810c4-2ccf-4fa7-9b56-5f75ab2a6a10" ), first.RecordingIdentifier, "identifier" );
            Assert.AreEqual( new DateTime( 2011, 1, 1, 10, 1, 54, 847, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "# 9", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { "de", "en", "es" }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { "SciFi", "Kids", "Fantasy", "Animation" }, first.Genres, "genre" );
            Assert.IsNull( first.Series, "series" );
        }

        /// <summary>
        /// Zeigt eine bestimmte Seite an.
        /// </summary>
        [Test]
        public void ShowPage200()
        {
        }
    }
}
