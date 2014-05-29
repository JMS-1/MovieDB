using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using NUnit.Framework;
using WebApp.Models;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft den Umgang mit der Tabelle der Sprachen.
    /// </summary>
    [TestFixture]
    public class LanguageTableTests : DatabaseTestBase
    {
        /// <summary>
        /// Liest alle Sprachen ein.
        /// </summary>
        [Test]
        public void CanReadLanguages()
        {
            TestContext.Languages.ToArray();
        }

        /// <summary>
        /// Es ist möglich, weitere Sprachen zu ergänzen.
        /// </summary>
        [Test]
        public void CanAddLanguage()
        {
            var languages = TestContext.Languages;

            languages.Add( new Language { ShortName = "de", LongName = "Deutsch" } );
            languages.Add( new Language { ShortName = "en", LongName = "Englisch" } );
            languages.Add( new Language { ShortName = "fr", LongName = "Französisch" } );

            TestContext.SaveChanges();

            using (TestContext)
                TestContext = new Database();

            Assert.AreEqual( "Deutsch", TestContext.Languages.Find( "de" ).LongName, "de" );

            var map = TestContext.Languages.ToDictionary( l => l.ShortName, l => l.LongName );

            Assert.AreEqual( "Deutsch", map["de"], "de" );
            Assert.AreEqual( "Englisch", map["en"], "en" );
            Assert.AreEqual( "Französisch", map["fr"], "fr" );
        }

        /// <summary>
        /// Der Kurzname der Sprache muss gesetzt werden und zwei Zeichen lang sein.
        /// </summary>
        /// <param name="shortName">Der Name für den Test.</param>
        [TestCase( null )]
        [TestCase( "" )]
        [TestCase( "x" )]
        [TestCase( "xyz" )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void ShortNameMustBeExactlyTwoCharacters( string shortName )
        {
            TestContext.Languages.Add( new Language { ShortName = shortName, LongName = "Test" } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Langname der Sprache muss gesetzt sein und zwischen 1 und 100 Zeichen haben.
        /// </summary>
        /// <param name="longName">Der Name für den Test.</param>
        [TestCase( null )]
        [TestCase( "" )]
        [TestCase( "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1" )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void LongNameMustHaveBetween1And100Charaters( string longName )
        {
            TestContext.Languages.Add( new Language { ShortName = "xx", LongName = longName } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Kurzname muss eindeutig sein.
        /// </summary>
        [Test]
        [ExpectedException( typeof( DbUpdateException ) )]
        public void ShortNameMustBeUnique()
        {
            TestContext.Languages.Add( new Language { ShortName = "xx", LongName = "one" } );
            TestContext.Languages.Add( new Language { ShortName = "xx", LongName = "two" } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Langname muss eindeutig sein.
        /// </summary>
        [Test]
        [ExpectedException( typeof( DbUpdateException ) )]
        public void LongNameMustBeUnique()
        {
            TestContext.Languages.Add( new Language { ShortName = "x1", LongName = "long" } );
            TestContext.Languages.Add( new Language { ShortName = "x2", LongName = "long" } );
            TestContext.SaveChanges();
        }
    }
}
