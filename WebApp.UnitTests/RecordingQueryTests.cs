using System;
using NUnit.Framework;
using WebApp.Controllers;
using WebApp.Models;


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
            var recordings = Controller.Query( new SearchRequest { PageIndex = 200 } );

            Assert.AreEqual( 200, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 7725, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new Guid( "954d83e6-2e4f-4957-a0d1-f3283e21a6ad" ), first.RecordingIdentifier, "identifier" );
            Assert.AreEqual( new DateTime( 2006, 12, 17, 13, 59, 9, 517, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "Indiana Jones (1)", first.Name, "name" );
            CollectionAssert.IsEmpty( first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { "Action" }, first.Genres, "genre" );
            Assert.IsNull( first.Series, "series" );
        }

        /// <summary>
        /// Wählt eine andere Anzahl von Einträgen pro Seite.
        /// </summary>
        [Test]
        public void Show50RecordingsOnPage()
        {
            var recordings = Controller.Query( new SearchRequest { PageIndex = 154, PageSize = 50 } );

            Assert.AreEqual( 154, recordings.PageIndex, "index" );
            Assert.AreEqual( 50, recordings.PageSize, "size" );
            Assert.AreEqual( 7725, recordings.TotalCount, "total" );
            Assert.AreEqual( 25, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new Guid( "bc53aa8b-7403-4949-9095-2a887334d4f9" ), first.RecordingIdentifier, "identifier" );
            Assert.AreEqual( new DateTime( 2009, 6, 11, 8, 37, 33, 227, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "08 Marty als Baseballstar", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { "de" }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { "Animation", "Kids" }, first.Genres, "genre" );
            Assert.AreEqual( new Guid( "a8dacbc4-900d-4ccb-8547-7fc940945be2" ), first.Series, "series" );
        }

        /// <summary>
        /// Sortiert nach dem Namen abwärts.
        /// </summary>
        [Test]
        public void OrderByNameDescending()
        {
            var recordings = Controller.Query( new SearchRequest { SortAscending = false, PageSize = 75, PageIndex = 13 } );

            Assert.AreEqual( 13, recordings.PageIndex, "index" );
            Assert.AreEqual( 75, recordings.PageSize, "size" );
            Assert.AreEqual( 7725, recordings.TotalCount, "total" );
            Assert.AreEqual( 75, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new Guid( "845c3d91-464a-4d21-a72f-508c48237c0d" ), first.RecordingIdentifier, "identifier" );
            Assert.AreEqual( new DateTime( 2005, 1, 5, 22, 4, 19, 757, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "14 Die fünfte Spezies", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { "de" }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { "SciFi" }, first.Genres, "genre" );
            Assert.AreEqual( new Guid( "dd84b77c-49c4-416a-bf4d-8d95038f1817" ), first.Series, "series" );
        }

        /// <summary>
        /// Sortiert nach dem Datum aufwärts.
        /// </summary>
        [Test]
        public void OrderByDateAscending()
        {
            var recordings = Controller.Query( new SearchRequest { PageSize = 30, PageIndex = 38, OrderBy = SearchRequestOrderBy.Created } );

            Assert.AreEqual( 38, recordings.PageIndex, "index" );
            Assert.AreEqual( 30, recordings.PageSize, "size" );
            Assert.AreEqual( 7725, recordings.TotalCount, "total" );
            Assert.AreEqual( 30, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new Guid( "a727de10-b8b6-4c66-9773-1217f1610ae9" ), first.RecordingIdentifier, "identifier" );
            Assert.AreEqual( new DateTime( 2007, 10, 6, 17, 45, 16, 390, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "05 Earthbound ", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { "en" }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { "SciFi" }, first.Genres, "genre" );
            Assert.AreEqual( new Guid( "8cba2342-8c8c-403e-b512-58a3301e8ba0" ), first.Series, "series" );
        }

        /// <summary>
        /// Sortiert nach dem Datum abwärts.
        /// </summary>
        [Test]
        public void OrderByDateDescending()
        {
            var recordings = Controller.Query( new SearchRequest { OrderBy = SearchRequestOrderBy.Created, SortAscending = false } );

            Assert.AreEqual( 0, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 7725, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new Guid( "b232b236-85b2-4edb-ba56-566580b08430" ), first.RecordingIdentifier, "identifier" );
            Assert.AreEqual( new DateTime( 2014, 6, 1, 15, 4, 15, 803, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "Continuum", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { "de", "en", "es" }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { "SciFi" }, first.Genres, "genre" );
            Assert.AreEqual( new Guid( "9795cc04-1aab-4755-bab1-9bf6c3244e29" ), first.Series, "series" );
        }

        /// <summary>
        /// Sortiert nach einer Liste von Arten.
        /// </summary>
        [Test]
        public void RestrictByGenreList()
        {
            var recordings = Controller.Query( new SearchRequest { RequiredGenres = { "scifi", "Kids" }, PageIndex = 7 } );

            Assert.AreEqual( 7, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 175, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new Guid( "46284984-6096-4e76-b4f2-669fc66e32a3" ), first.RecordingIdentifier, "identifier" );
            Assert.AreEqual( new DateTime( 2011, 4, 16, 9, 31, 56, 687, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "13 Monster", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { "de" }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { "SciFi", "Kids", "Animation" }, first.Genres, "genre" );
            Assert.AreEqual( new Guid( "7aae563f-3a43-4975-803f-ae1c3040d9b7" ), first.Series, "series" );
        }

        /// <summary>
        /// Suche nach einer Sprache.
        /// </summary>
        [Test]
        public void RestrictByLanguage()
        {
            var recordings = Controller.Query( new SearchRequest { RequiredLanguage = "pt" } );

            Assert.AreEqual( 0, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 1, recordings.TotalCount, "total" );
            Assert.AreEqual( 1, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new Guid( "6f6649a4-dcdc-4699-ad9c-8fcadea10fb0" ), first.RecordingIdentifier, "identifier" );
            Assert.AreEqual( new DateTime( 2009, 6, 20, 18, 13, 29, 717, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "Movie", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { "de", "en", "nl", "pt", "tr" }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { "SciFi", "Kids", "Action", "Animation" }, first.Genres, "genre" );
            Assert.AreEqual( new Guid( "b759ab0f-e8b5-4c11-9005-e249ba8674c9" ), first.Series, "series" );
        }
    }
}
