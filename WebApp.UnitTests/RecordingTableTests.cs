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
                    Title = "super",
                    Description = "what",
                    CreationTime = refTime,
                } );
            var id = created.Identifier;

            TestContext.SaveChanges();

            Recreate();

            var recording = TestContext.Recordings.Find( id );

            Assert.IsNotNull( recording, "id" );
            Assert.AreNotSame( created, recording, "cache" );
            Assert.AreEqual( "super", recording.Title, "Title" );
            Assert.AreEqual( "what", recording.Description, "Description" );
            Assert.AreEqual( refTime, recording.CreationTime, "CreationTime" );
            Assert.AreEqual( id, recording.Identifier, "Id" );
        }

        /// <summary>
        /// Die eindeutige Kennung muss eindeutig sein.
        /// </summary>
        [Test, ExpectedException( typeof( DbUpdateException ) )]
        public void IdentifierMustBeUnique()
        {
            var id = Guid.NewGuid();

            TestContext.Recordings.Add( new Recording { Identifier = id, Title = "A4", Description = "A4", CreationTime = DateTime.UtcNow } );
            TestContext.Recordings.Add( new Recording { Identifier = id, Title = "B4", Description = "B4", CreationTime = DateTime.UtcNow } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Name einer Aufzeichnung muss nicht eindeutig sein.
        /// </summary>
        [Test]
        public void TitleCanBeUsedMultipleTimes()
        {
            TestContext.Recordings.Add( new Recording { Title = "A3", Description = "A3", CreationTime = DateTime.UtcNow } );
            TestContext.Recordings.Add( new Recording { Title = "A3", Description = "B3", CreationTime = DateTime.UtcNow } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung einer Aufzeichnung muss nicht eindeutig sein.
        /// </summary>
        [Test]
        public void DescriptionCanBeUsedMultipleTimes()
        {
            TestContext.Recordings.Add( new Recording { Title = "A2", Description = "A2", CreationTime = DateTime.UtcNow } );
            TestContext.Recordings.Add( new Recording { Title = "B2", Description = "A2", CreationTime = DateTime.UtcNow } );
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

            TestContext.Recordings.Add( new Recording { Title = title, Description = "A5", CreationTime = DateTime.UtcNow } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung ist optional.
        /// </summary>
        [Test]
        public void DescriptionIsOptionalAndLimitedTo2000Characters()
        {
            TestContext.Recordings.Add( new Recording { Title = "A1", Description = null, CreationTime = DateTime.UtcNow } );
            TestContext.Recordings.Add( new Recording { Title = "B1", Description = string.Empty, CreationTime = DateTime.UtcNow } );
            TestContext.Recordings.Add( new Recording { Title = "C1", Description = new string( 'A', 2000 ), CreationTime = DateTime.UtcNow } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung kann nicht mehr als 2000 Zeichen haben.
        /// </summary>
        [Test, ExpectedException( typeof( DbEntityValidationException ) )]
        public void DescriptionIsLimitedTo2000Characters()
        {
            TestContext.Recordings.Add( new Recording { Title = "A6", Description = new string( 'A', 2001 ), CreationTime = DateTime.UtcNow } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Es ist möglich, eine Aufzeichnung mit Sprachinformationen anzulegen.
        /// </summary>
        [Test]
        public void CanAddRecordingWithLanguages()
        {
            var lang1 = TestContext.Languages.Add( new Language { TwoLetterIsoName = "l1", Description = "language 1" } );
            var lang2 = TestContext.Languages.Add( new Language { TwoLetterIsoName = "l2", Description = "language 2" } );

            var rec = TestContext.Recordings.Add( new Recording { Title = "A7", CreationTime = DateTime.UtcNow } );

            rec.Languages.Add( lang1 );
            rec.Languages.Add( lang2 );

            TestContext.SaveChanges();

            Recreate();

            var retest =
                TestContext
                    .Recordings
                    .Include( recording => recording.Languages )
                    .FirstOrDefault( recording => recording.Identifier == rec.Identifier );

            Assert.IsNotNull( retest, "id" );
            Assert.AreNotSame( rec, retest, "cache" );

            var lang = new HashSet<string>( retest.Languages.Select( l => l.TwoLetterIsoName ) );

            Assert.AreEqual( 2, lang.Count, "#lang" );
            Assert.IsTrue( lang.Contains( "l1" ), "1" );
            Assert.IsTrue( lang.Contains( "l2" ), "2" );
        }

        /// <summary>
        /// Es ist möglich, eine Aufzeichnung mit Klassifikationen anzulegen.
        /// </summary>
        [Test]
        public void CanAddRecordingWithGenres()
        {
            var genre1 = TestContext.Genres.Add( new Genre { Name = "g1", Description = "genre 1" } );
            var genre2 = TestContext.Genres.Add( new Genre { Name = "g2", Description = "genre 2" } );

            var rec = TestContext.Recordings.Add( new Recording { Title = "A8", CreationTime = DateTime.UtcNow } );

            rec.Genres.Add( genre1 );
            rec.Genres.Add( genre2 );

            TestContext.SaveChanges();

            Recreate();

            var retest =
                TestContext
                    .Recordings
                    .Include( recording => recording.Genres )
                    .FirstOrDefault( recording => recording.Identifier == rec.Identifier );

            Assert.IsNotNull( retest, "id" );
            Assert.AreNotSame( rec, retest, "cache" );

            var gen = new HashSet<string>( retest.Genres.Select( l => l.Name ) );

            Assert.AreEqual( 2, gen.Count, "#genres" );
            Assert.IsTrue( gen.Contains( "g1" ), "1" );
            Assert.IsTrue( gen.Contains( "g2" ), "2" );
        }

        /// <summary>
        /// Eine Aufzeichnung kann einem physikalischen Ablageort zugeordnet sein.
        /// </summary>
        [Test]
        public void CanHaveMedia()
        {
            var container = TestContext.Containers.Add( new Container { Name = "A9", Type = ContainerType.FeatureSet } );
            var media = TestContext.Stores.Add( new Store { Type = StoreType.RecordedDVD, Container = container, Location = "1R" } );
            var recording = TestContext.Recordings.Add( new Recording { Title = "B9", CreationTime = DateTime.UtcNow, Store = media } );

            TestContext.SaveChanges();

            Recreate();

            var retest = TestContext.Recordings.Include( r => r.Store.Container ).Single( r => r.Title == "B9" );

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
            var recording = TestContext.Recordings.Add( new Recording { Title = "B10", CreationTime = DateTime.UtcNow, Store = media } );
            var mediaId = media.Identifier;

            TestContext.SaveChanges();

            Recreate();

            TestContext.Entry( new Store { Identifier = mediaId } ).State = EntityState.Deleted;
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
            var recording1 = TestContext.Recordings.Add( new Recording { Title = "B11", CreationTime = DateTime.UtcNow, Store = media } ).Identifier;
            var recording2 = TestContext.Recordings.Add( new Recording { Title = "C11", CreationTime = DateTime.UtcNow, Store = media } ).Identifier;
            var mediaId = media.Identifier;

            TestContext.SaveChanges();

            Recreate();

            TestContext.Entry( new Recording { Identifier = recording1 } ).State = EntityState.Deleted;
            TestContext.SaveChanges();

            Recreate();

            Assert.IsNotNull( TestContext.Stores.Find( mediaId ), "first delete" );

            TestContext.Entry( new Recording { Identifier = recording2 } ).State = EntityState.Deleted;
            TestContext.SaveChanges();

            Recreate();

            Assert.IsNull( TestContext.Stores.Find( mediaId ), "second delete" );
        }
    }
}
