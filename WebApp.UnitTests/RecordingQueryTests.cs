using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using WebApp.Controllers;
using WebApp.DTO;
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
        /// Alle Sprachen.
        /// </summary>
        private Dictionary<string, Guid> m_languages;

        /// <summary>
        /// Alle Kategorien.
        /// </summary>
        private Dictionary<string, Guid> m_genres;

        /// <summary>
        /// Alle Serien.
        /// </summary>
        private Dictionary<string, Guid> m_series;

        /// <summary>
        /// Wird einmalig vor dem ersten Test aufgerufen.
        /// </summary>
        public override void BeforeFirstTest()
        {
            base.BeforeFirstTest();

            // Nachschlagekarten füllen
            using (var app = new ApplicationController())
            {
                var info = app.GetInformation();

                // Nachschlagekarten aufbauen
                m_languages = info.Languages.ToDictionary( l => l.Name, l => l.Identifier, StringComparer.InvariantCultureIgnoreCase );
                m_genres = info.Genres.ToDictionary( g => g.Name, g => g.Identifier, StringComparer.InvariantCultureIgnoreCase );
                m_series = info.Series.ToDictionary( s => s.FullName, s => s.UniqueIdentifier, StringComparer.InvariantCultureIgnoreCase );
            }
        }

        /// <summary>
        /// Meldet das Ergebnis der Suche ohne Angabe von Parametern.
        /// </summary>
        [Test]
        public void InitialQuery()
        {
            var recordings = Controller.Query();

            Assert.AreEqual( 0, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 7757, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2011, 1, 1, 10, 1, 54, 847, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "# 9", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["de"], m_languages["en"], m_languages["es"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["SciFi"], m_genres["Kids"], m_genres["Fantasy"], m_genres["Animation"] }, first.Genres, "genre" );
            Assert.IsNull( first.Series, "series" );

            Assert.AreEqual( 23, recordings.GenreStatistics.Length, "#genres" );
            Assert.AreEqual( 1502, recordings.GenreStatistics.Single( g => g.Identifier == m_genres["Action"] ).Count, "genre count" );
            Assert.AreEqual( 13, recordings.LanguageStatistics.Length, "#languages" );
            Assert.AreEqual( 215, recordings.LanguageStatistics.Single( g => g.Identifier == m_languages["fr"] ).Count, "language count" );
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
            Assert.AreEqual( 7757, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2008, 4, 3, 14, 42, 3, 500, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "22 Einzug der Sandkneifer", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["de"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["Animation"], m_genres["Kids"] }, first.Genres, "genre" );
            Assert.IsNotNull( first.Series, "series" );
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
            Assert.AreEqual( 7757, recordings.TotalCount, "total" );
            Assert.AreEqual( 50, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2009, 2, 7, 17, 3, 2, 530, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "Meteoriten in Süddeutschland", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["de"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["Docu"] }, first.Genres, "genre" );
            Assert.IsNotNull( first.Series, "series" );
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
            Assert.AreEqual( 7757, recordings.TotalCount, "total" );
            Assert.AreEqual( 75, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2005, 1, 5, 22, 4, 19, 757, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "14 Die fünfte Spezies", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["de"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["SciFi"] }, first.Genres, "genre" );
            Assert.IsNotNull( first.Series, "series" );
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
            Assert.AreEqual( 7757, recordings.TotalCount, "total" );
            Assert.AreEqual( 30, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2007, 10, 6, 17, 45, 16, 390, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "05 Earthbound ", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["en"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["SciFi"] }, first.Genres, "genre" );
            Assert.IsNotNull( first.Series, "series" );
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
            Assert.AreEqual( 7757, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2014, 6, 27, 20, 28, 52, 883, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "17 Carpe Diem", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["de"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["Crime"], m_genres["Thriller"] }, first.Genres, "genre" );
            Assert.IsNotNull( first.Series, "series" );
        }

        /// <summary>
        /// Sortiert nach einer Liste von Arten.
        /// </summary>
        [Test]
        public void RestrictByGenreList()
        {
            var recordings = Controller.Query( new SearchRequest { RequiredGenres = { m_genres["scifi"], m_genres["Kids"] }, PageIndex = 7 } );

            Assert.AreEqual( 7, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 175, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2011, 4, 16, 9, 31, 56, 687, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "13 Monster", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["de"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["SciFi"], m_genres["Kids"], m_genres["Animation"] }, first.Genres, "genre" );
            Assert.IsNotNull( first.Series, "series" );
        }

        /// <summary>
        /// Suche nach einer Sprache.
        /// </summary>
        [Test]
        public void RestrictByLanguage()
        {
            var recordings = Controller.Query( new SearchRequest { RequiredLanguage = m_languages["pt"] } );

            Assert.AreEqual( 0, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 1, recordings.TotalCount, "total" );
            Assert.AreEqual( 1, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2009, 6, 20, 18, 13, 29, 717, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "Movie", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["de"], m_languages["en"], m_languages["nl"], m_languages["pt"], m_languages["tr"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["SciFi"], m_genres["Kids"], m_genres["Action"], m_genres["Animation"] }, first.Genres, "genre" );
            Assert.IsNotNull( first.Series, "series" );
        }

        /// <summary>
        /// Sortiert nach dem Verleihmodus.
        /// </summary>
        [TestCase( false, 7703 )]
        [TestCase( true, 54 )]
        public void CheckRentOption( bool isRent, int expected )
        {
            var recordings = Controller.Query( new SearchRequest { IsRent = isRent } );

            Assert.AreEqual( expected, recordings.TotalCount, "total" );

            if (isRent)
                Assert.AreEqual( "kann weg", recordings.Recordings[0].RentTo, "rent#0" );
            else
                Assert.IsNull( recordings.Recordings[0].RentTo, "rent#0" );
        }

        /// <summary>
        /// Schränkt die Suche nach einer Serie ein.
        /// </summary>
        [Test]
        public void RestrictBySeries()
        {
            var series = m_series["CSI > Las Vegas > Season 13"];
            var recordings = Controller.Query( new SearchRequest { AllowedSeries = { series } } );

            Assert.AreEqual( 0, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 22, recordings.TotalCount, "total" );
            Assert.AreEqual( 15, recordings.Recordings.Length, "#recordings" );

            var first = recordings.Recordings[0];

            Assert.AreEqual( new DateTime( 2013, 9, 24, 19, 50, 50, 427, DateTimeKind.Utc ), first.CreationTime, "time" );
            Assert.AreEqual( "01 Kampf mit dem Karma", first.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["de"] }, first.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["Crime"], m_genres["Thriller"] }, first.Genres, "genre" );
            Assert.AreEqual( series, first.Series, "series" );
        }

        /// <summary>
        /// Führt eine Freitextsuche aus.
        /// </summary>
        [Test]
        public void RestrictByText()
        {
            var recordings = Controller.Query( new SearchRequest { Text = "doctor", PageIndex = 15 } );

            Assert.AreEqual( 15, recordings.PageIndex, "index" );
            Assert.AreEqual( 15, recordings.PageSize, "size" );
            Assert.AreEqual( 231, recordings.TotalCount, "total" );
            Assert.AreEqual( 6, recordings.Recordings.Length, "#recordings" );

            var last = recordings.Recordings[5];

            Assert.AreEqual( new DateTime( 2008, 7, 5, 16, 52, 41, 627, DateTimeKind.Utc ), last.CreationTime, "time" );
            Assert.AreEqual( "Verity Lambert - Drama Queen (Doctor Who)", last.Name, "name" );
            CollectionAssert.AreEquivalent( new[] { m_languages["en"] }, last.Languages, "language" );
            CollectionAssert.AreEquivalent( new[] { m_genres["Docu"] }, last.Genres, "genre" );
            Assert.IsNull( last.Series, "series" );

            Assert.AreEqual( 9, recordings.GenreStatistics.Length, "#genres" );
            Assert.AreEqual( 121, recordings.GenreStatistics.Single( g => g.Identifier == m_genres["Action"] ).Count, "genre count" );
            Assert.AreEqual( 5, recordings.LanguageStatistics.Length, "#languages" );
            Assert.AreEqual( 28, recordings.LanguageStatistics.Single( g => g.Identifier == m_languages["de"] ).Count, "language count" );
        }
    }
}
