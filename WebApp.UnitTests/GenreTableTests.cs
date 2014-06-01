using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using NUnit.Framework;
using WebApp.DAL;
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

            genres.Add( new Genre { Name = "scifi", Description = "Science Fiction" } );
            genres.Add( new Genre { Name = "horror", Description = "Horror" } );
            genres.Add( new Genre { Name = "comedy", Description = "Komödie" } );

            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( "Horror", TestContext.Genres.Find( "horror" ).Description, "horror" );

            var map = TestContext.Genres.ToDictionary( l => l.Name, l => l.Description );

            Assert.AreEqual( "Science Fiction", map["scifi"], "scifi" );
            Assert.AreEqual( "Horror", map["horror"], "horror" );
            Assert.AreEqual( "Komödie", map["comedy"], "comedy" );
        }

        /// <summary>
        /// Der Kurzname der Art muss gesetzt werden und muss zwischen 1 und 20 Zeichen haben.
        /// </summary>
        /// <param name="shortName">Der Name für den Test.</param>
        [TestCase( null )]
        [TestCase( "" )]
        [TestCase( "xxxxxxxxxxxxxxxxxxxx1" )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void ShortNameMustHaveBetween1And100Charaters( string shortName )
        {
            TestContext.Genres.Add( new Genre { Name = shortName, Description = "Test" } );
            TestContext.SaveChanges();
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
            TestContext.Genres.Add( new Genre { Name = "xx", Description = longName } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Kurzname muss eindeutig sein.
        /// </summary>
        [Test]
        [ExpectedException( typeof( DbUpdateException ) )]
        public void ShortNameMustBeUnique()
        {
            TestContext.Genres.Add( new Genre { Name = "xx", Description = "one" } );
            TestContext.Genres.Add( new Genre { Name = "xx", Description = "two" } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Langname muss eindeutig sein.
        /// </summary>
        [Test]
        [ExpectedException( typeof( DbUpdateException ) )]
        public void LongNameMustBeUnique()
        {
            TestContext.Genres.Add( new Genre { Name = "x1", Description = "long" } );
            TestContext.Genres.Add( new Genre { Name = "x2", Description = "long" } );
            TestContext.SaveChanges();
        }
    }
}
