using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using NUnit.Framework;
using WebApp.Models;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft den Umgang mit der Tabelle der Programmarten.
    /// </summary>
    [TestFixture]
    public class GenreTableTests : DatabaseTestBase
    {
        /// <summary>
        /// Liest alle Arten ein.
        /// </summary>
        [Test]
        public void CanReadGenres()
        {
            TestContext.Genres.ToArray();
        }

        /// <summary>
        /// Es ist möglich, weitere Arten zu ergänzen.
        /// </summary>
        [Test]
        public void CanAddGenre()
        {
            var genres = TestContext.Genres;

            var scifi = genres.Add( new Genre { Description = "Science Fiction" } ).UniqueIdentifier;
            var horror = genres.Add( new Genre { Description = "Horror" } ).UniqueIdentifier;
            var comedy = genres.Add( new Genre { Description = "Komödie" } ).UniqueIdentifier;

            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( "Horror", TestContext.Genres.Find( horror ).Description, "horror" );

            var map = TestContext.Genres.ToDictionary( l => l.UniqueIdentifier, l => l.Description );

            Assert.AreEqual( "Science Fiction", map[scifi], "scifi" );
            Assert.AreEqual( "Horror", map[horror], "horror" );
            Assert.AreEqual( "Komödie", map[comedy], "comedy" );
        }

        /// <summary>
        /// Der Langname der Art muss gesetzt sein und zwischen 1 und 100 Zeichen haben.
        /// </summary>
        /// <param name="longName">Der Name für den Test.</param>
        [TestCase( null )]
        [TestCase( "" )]
        [TestCase( "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1" )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void LongNameMustHaveBetween1And100Charaters( string longName )
        {
            TestContext.Genres.Add( new Genre { Description = longName } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Langname muss eindeutig sein.
        /// </summary>
        [Test]
        [ExpectedException( typeof( DbUpdateException ) )]
        public void LongNameMustBeUnique()
        {
            TestContext.Genres.Add( new Genre { Description = "long" } );
            TestContext.Genres.Add( new Genre { Description = "long" } );
            TestContext.SaveChanges();
        }
    }
}
