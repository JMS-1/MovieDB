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

            var de = languages.Add( new Language { Name = "Deutsch" } ).UniqueIdentifier;
            var en = languages.Add( new Language { Name = "Englisch" } ).UniqueIdentifier;
            var fr = languages.Add( new Language { Name = "Französisch" } ).UniqueIdentifier;

            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( "Deutsch", TestContext.Languages.Find( de ).Name, "de" );

            var map = TestContext.Languages.ToDictionary( l => l.UniqueIdentifier, l => l.Name );

            Assert.AreEqual( "Deutsch", map[de], "de" );
            Assert.AreEqual( "Englisch", map[en], "en" );
            Assert.AreEqual( "Französisch", map[fr], "fr" );
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
            TestContext.Languages.Add( new Language { Name = longName } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Langname muss eindeutig sein.
        /// </summary>
        [Test]
        [ExpectedException( typeof( DbUpdateException ) )]
        public void LongNameMustBeUnique()
        {
            TestContext.Languages.Add( new Language { Name = "long" } );
            TestContext.Languages.Add( new Language { Name = "long" } );
            TestContext.SaveChanges();
        }
    }
}
