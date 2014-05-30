using System;
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
            TestContext.Recordings.ToArray();
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
            var id = created.Id;

            TestContext.SaveChanges();

            using (TestContext)
                TestContext = new Database();

            var recording = TestContext.Recordings.Find( id );

            Assert.IsNotNull( recording, "id" );
            Assert.AreNotSame( created, recording, "cache" );
            Assert.AreEqual( "super", recording.Title, "Title" );
            Assert.AreEqual( "what", recording.Description, "Description" );
            Assert.AreEqual( refTime, recording.CreationTime, "CreationTime" );
            Assert.AreEqual( id, recording.Id, "Id" );
        }

        /// <summary>
        /// Die eindeutige Kennung muss eindeutig sein.
        /// </summary>
        [Test, ExpectedException( typeof( DbUpdateException ) )]
        public void IdentifierMustBeUnique()
        {
            var id = Guid.NewGuid();

            TestContext.Recordings.Add( new Recording { Id = id, Title = "A4", Description = "A4", CreationTime = DateTime.UtcNow } );
            TestContext.Recordings.Add( new Recording { Id = id, Title = "B4", Description = "B4", CreationTime = DateTime.UtcNow } );
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
    }
}
