using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using NUnit.Framework;
using WebApp.Models;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft den Umgang mit der Tabelle der Aufzeichnungen.
    /// </summary>
    [TestFixture]
    public class RecordingTableTests : DatabaseTestBase
    {
        /// <summary>
        /// Liest alle Aufzeichnungen ein.
        /// </summary>
        [Test]
        public void CanReadRecordings()
        {
            TestContext
                .Recordings
                .Include( recording => recording.Languages )
                .Include( recording => recording.Genres )
                .Include( recording => recording.Links )
                .Include( recording => recording.Store )
                .Include( recording => recording.Series )
                .ToArray();
        }

        /// <summary>
        /// Der hierarchische Name wird automatisch berechnet.
        /// </summary>
        [Test]
        public void CanCalculateFullName()
        {
            var series1 = TestContext.Series.Add( new Series { Name = "A" } ).UniqueIdentifier;
            var series2 = TestContext.Series.Add( new Series { Name = "B", ParentIdentifier = series1 } ).UniqueIdentifier;
            var series3 = TestContext.Series.Add( new Series { Name = "C", ParentIdentifier = series2 } ).UniqueIdentifier;
            var recording = TestContext.Recordings.Add( new Recording { Name = "X", CreationTime = DateTime.UtcNow, SeriesIdentifier = series3, Store = new Store { Location = "nowhere" } } ).UniqueIdentifier;

            // Normale Kette
            TestContext.SaveChanges();

            Recreate();

            var recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "A > B > C > X", recover.FullName, "initial" );

            recover.Name = "Y";

            // Die Aufzeichnung wurde umbenannt
            TestContext.SaveChanges();

            Recreate();

            recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "A > B > C > Y", recover.FullName, "title" );

            TestContext.Series.Find( series2 ).Name = "M";

            // Die mittlere Serie wurde umbenannt
            TestContext.SaveChanges();

            Recreate();

            recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "A > M > C > Y", recover.FullName, "middle" );

            TestContext.Series.Find( series3 ).Name = "N";

            // Die direkte Serie wurde umbenannte
            TestContext.SaveChanges();

            Recreate();

            recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "A > M > N > Y", recover.FullName, "inner" );

            TestContext.Series.Find( series1 ).Name = "O";

            // Die äußere Serie wurde umbenannt
            TestContext.SaveChanges();

            Recreate();

            recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "O > M > N > Y", recover.FullName, "outer" );

            TestContext.Entry( new Series { UniqueIdentifier = series2 } ).State = EntityState.Deleted;

            // Die mittlere Serie wurde gelöscht
            TestContext.SaveChanges();

            Recreate();

            recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "N > Y", recover.FullName, "remove middle" );

            Recreate();

            TestContext.Entry( new Series { UniqueIdentifier = series3 } ).State = EntityState.Deleted;

            // Die direkte Serie wurde gelöcht
            TestContext.SaveChanges();

            Recreate();

            recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "Y", recover.FullName, "remove direct" );

            recover.Name = "Z";
            recover.SeriesIdentifier = series1;

            // Die Aufzeichnung wurde umbenannt und an eine Serie gehängt
            TestContext.SaveChanges();

            Recreate();

            recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "O > Z", recover.FullName, "reconnect" );

            recover.SeriesIdentifier = null;

            // Die Aufzeichnung wurde von der Serie gelöst
            TestContext.SaveChanges();

            Recreate();

            recover = TestContext.Recordings.Include( r => r.Series ).Single( r => r.UniqueIdentifier == recording );
            Assert.AreEqual( "Z", recover.FullName, "disconnect" );
        }

        /// <summary>
        /// Es ist möglich, weitere Aufzeichnungen zu ergänzen.
        /// </summary>
        [Test]
        public void CanAddRecording()
        {
            var recordings = TestContext.Recordings;
            var refTime = new DateTime( 1963, 9, 29, 12, 25, 17, DateTimeKind.Local ).ToUniversalTime();
            var created = recordings.Add(
                new Recording
                {
                    Name = "super",
                    Store = new Store(),
                    Description = "what",
                    CreationTime = refTime,
                } );
            var id = created.UniqueIdentifier;

            TestContext.SaveChanges();

            Recreate();

            var recording = TestContext.Recordings.Find( id );

            Assert.IsNotNull( recording, "id" );
            Assert.AreNotSame( created, recording, "cache" );
            Assert.AreEqual( "super", recording.Name, "Title" );
            Assert.AreEqual( "super", recording.FullName, "FullName" );
            Assert.AreEqual( "what", recording.Description, "Description" );
            Assert.AreEqual( refTime, recording.CreationTime, "CreationTime" );
            Assert.AreEqual( id, recording.UniqueIdentifier, "Id" );
        }

        /// <summary>
        /// Die eindeutige Kennung muss eindeutig sein.
        /// </summary>
        [Test, ExpectedException( typeof( DbUpdateException ) )]
        public void IdentifierMustBeUnique()
        {
            var id = Guid.NewGuid();

            TestContext.Recordings.Add( new Recording { UniqueIdentifier = id, Name = "A4", Description = "A4", CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.Recordings.Add( new Recording { UniqueIdentifier = id, Name = "B4", Description = "B4", CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Name einer Aufzeichnung muss nicht eindeutig sein.
        /// </summary>
        [Test]
        public void TitleCanBeUsedMultipleTimes()
        {
            TestContext.Recordings.Add( new Recording { Name = "A3", Description = "A3", CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.Recordings.Add( new Recording { Name = "A3", Description = "B3", CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung einer Aufzeichnung muss nicht eindeutig sein.
        /// </summary>
        [Test]
        public void DescriptionCanBeUsedMultipleTimes()
        {
            TestContext.Recordings.Add( new Recording { Name = "A2", Description = "A2", CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.Recordings.Add( new Recording { Name = "B2", Description = "A2", CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Name muss gesetzt sein und gewissen Einschränkungen genügen.
        /// </summary>
        /// <param name="titleLength">Die Länge des Namens.</param>
        [TestCase( -1 )]
        [TestCase( 0 )]
        [TestCase( 201 )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void TitleMustBeSetAndRespectLengthLimits( int titleLength )
        {
            var title = (titleLength < 0) ? null : new string( 'x', titleLength );

            TestContext.Recordings.Add( new Recording { Name = title, Description = "A5", CreationTime = DateTime.UtcNow } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung ist optional.
        /// </summary>
        [Test]
        public void DescriptionIsOptionalAndLimitedTo2000Characters()
        {
            TestContext.Recordings.Add( new Recording { Name = "A1", Description = null, CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.Recordings.Add( new Recording { Name = "B1", Description = string.Empty, CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.Recordings.Add( new Recording { Name = "C1", Description = new string( 'A', 2000 ), CreationTime = DateTime.UtcNow, Store = new Store() } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung kann nicht mehr als 2000 Zeichen haben.
        /// </summary>
        [Test, ExpectedException( typeof( DbEntityValidationException ) )]
        public void DescriptionIsLimitedTo2000Characters()
        {
            TestContext.Recordings.Add( new Recording { Name = "A6", Description = new string( 'A', 2001 ), CreationTime = DateTime.UtcNow } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Es ist möglich, eine Aufzeichnung mit Sprachinformationen anzulegen.
        /// </summary>
        [Test]
        public void CanAddRecordingWithLanguages()
        {
            var lang1 = TestContext.Languages.Add( new Language { Name = "language 1" } );
            var lang2 = TestContext.Languages.Add( new Language { Name = "language 2" } );

            var rec = TestContext.Recordings.Add( new Recording { Name = "A7", CreationTime = DateTime.UtcNow, Store = new Store() } );

            rec.Languages.Add( lang1 );
            rec.Languages.Add( lang2 );

            TestContext.SaveChanges();

            Recreate();

            var retest =
                TestContext
                    .Recordings
                    .Include( recording => recording.Languages )
                    .FirstOrDefault( recording => recording.UniqueIdentifier == rec.UniqueIdentifier );

            Assert.IsNotNull( retest, "id" );
            Assert.AreNotSame( rec, retest, "cache" );

            var lang = new HashSet<string>( retest.Languages.Select( l => l.Name ) );

            Assert.AreEqual( 2, lang.Count, "#lang" );
            Assert.IsTrue( lang.Contains( "language 1" ), "1" );
            Assert.IsTrue( lang.Contains( "language 2" ), "2" );
        }

        /// <summary>
        /// Es ist möglich, eine Aufzeichnung mit Klassifikationen anzulegen.
        /// </summary>
        [Test]
        public void CanAddRecordingWithGenres()
        {
            var genre1 = TestContext.Genres.Add( new Genre { Name = "genre 1" } );
            var genre2 = TestContext.Genres.Add( new Genre { Name = "genre 2" } );

            var rec = TestContext.Recordings.Add( new Recording
            {
                CreationTime = DateTime.UtcNow,
                Store = new Store(),
                Name = "A8",
            } );

            rec.Genres.Add( genre1 );
            rec.Genres.Add( genre2 );

            TestContext.SaveChanges();

            Recreate();

            var retest =
                TestContext
                    .Recordings
                    .Include( recording => recording.Genres )
                    .FirstOrDefault( recording => recording.UniqueIdentifier == rec.UniqueIdentifier );

            Assert.IsNotNull( retest, "id" );
            Assert.AreNotSame( rec, retest, "cache" );

            var gen = new HashSet<string>( retest.Genres.Select( l => l.Name ) );

            Assert.AreEqual( 2, gen.Count, "#genres" );
            Assert.IsTrue( gen.Contains( "genre 1" ), "1" );
            Assert.IsTrue( gen.Contains( "genre 2" ), "2" );
        }

        /// <summary>
        /// Eine Aufzeichnung kann einem physikalischen Ablageort zugeordnet sein.
        /// </summary>
        [Test]
        public void CanHaveMedia()
        {
            var container = TestContext.Containers.Add( new Container { Name = "A9", Type = ContainerType.FeatureSet } );
            var media = TestContext.Stores.Add( new Store { Type = StoreType.RecordedDVD, Container = container, Location = "1R" } );
            var recording = TestContext.Recordings.Add( new Recording { Name = "B9", CreationTime = DateTime.UtcNow, Store = media } );

            TestContext.SaveChanges();

            Recreate();

            var retest = TestContext.Recordings.Include( r => r.Store.Container ).Single( r => r.Name == "B9" );

            Assert.AreEqual( "A9", retest.Store.Container.Name, "container" );
        }

        /// <summary>
        /// Das Löschen eines pyhsikalischen Ablageortes is nicht möglich, wenn dieser noch in Verwendung ist.
        /// </summary>
        [Test, ExpectedException( typeof( DbUpdateException ) )]
        public void CanNotDeleteReferencedMedia()
        {
            var container = TestContext.Containers.Add( new Container { Name = "A10", Type = ContainerType.FeatureSet } );
            var media = TestContext.Stores.Add( new Store { Type = StoreType.RecordedDVD, Container = container, Location = "2R" } );
            var recording = TestContext.Recordings.Add( new Recording { Name = "B10", CreationTime = DateTime.UtcNow, Store = media } );
            var mediaId = media.UniqueIdentifier;

            TestContext.SaveChanges();

            Recreate();

            TestContext.Entry( new Store { UniqueIdentifier = mediaId } ).State = EntityState.Deleted;
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Ein physikalischer Ablageort wird automatisch gelöscht wenn keine Aufzeichnung mehr darauf verweist.
        /// </summary>
        [Test]
        public void DeleteMediaAfterLastRecordingIsDeleted()
        {
            var container = TestContext.Containers.Add( new Container { Name = "A11", Type = ContainerType.FeatureSet } );
            var media = TestContext.Stores.Add( new Store { Type = StoreType.RecordedDVD, Container = container, Location = "3L" } );
            var recording1 = TestContext.Recordings.Add( new Recording { Name = "B11", CreationTime = DateTime.UtcNow, Store = media } ).UniqueIdentifier;
            var recording2 = TestContext.Recordings.Add( new Recording { Name = "C11", CreationTime = DateTime.UtcNow, Store = media } ).UniqueIdentifier;
            var mediaId = media.UniqueIdentifier;

            TestContext.SaveChanges();

            Recreate();

            TestContext.Entry( new Recording { UniqueIdentifier = recording1 } ).State = EntityState.Deleted;
            TestContext.SaveChanges();

            Recreate();

            Assert.IsNotNull( TestContext.Stores.Find( mediaId ), "first delete" );

            TestContext.Entry( new Recording { UniqueIdentifier = recording2 } ).State = EntityState.Deleted;
            TestContext.SaveChanges();

            Recreate();

            Assert.IsNull( TestContext.Stores.Find( mediaId ), "second delete" );
        }

        /// <summary>
        /// Die Beschreibung ist optional.
        /// </summary>
        [Test]
        public void RentIsOptionalAndLimitedTo200Characters()
        {
            TestContext.Recordings.Add( new Recording { Name = "A12", CreationTime = DateTime.UtcNow, RentTo = null, Store = new Store() } );
            TestContext.Recordings.Add( new Recording { Name = "B12", CreationTime = DateTime.UtcNow, RentTo = string.Empty, Store = new Store() } );
            TestContext.Recordings.Add( new Recording { Name = "C12", CreationTime = DateTime.UtcNow, RentTo = new string( 'A', 200 ), Store = new Store() } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Verleiher kann nicht mehr als 200 Zeichen haben.
        /// </summary>
        [Test, ExpectedException( typeof( DbEntityValidationException ) )]
        public void RentIsLimitedTo200Characters()
        {
            TestContext.Recordings.Add( new Recording { Name = "A13", CreationTime = DateTime.UtcNow, RentTo = new string( 'A', 201 ) } );
            TestContext.SaveChanges();
        }
    }
}
