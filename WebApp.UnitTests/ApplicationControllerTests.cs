using NUnit.Framework;
using WebApp.Controllers;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft das Arbeiten mit dem Anwendungsdienst.
    /// </summary>
    [TestFixture]
    public class ApplicationControllerTests : ControllerTestBase<ApplicationController>
    {
        /// <summary>
        /// Aktiviert die Systeminformationen.
        /// </summary>
        [Test]
        public void GetApplicationStartupInformation()
        {
            var info = Controller.GetInformation();

            Assert.IsFalse( info.DatabaseIsEmpty, "empty" );
            Assert.AreEqual( 7749, info.NumberOfRecordings, "#recordings" );
            Assert.AreEqual( 13, info.Languages.Length, "#languages" );
            Assert.AreEqual( 528, info.Series.Length, "#series" );
            Assert.AreEqual( 23, info.Genres.Length, "#genres" );

            Assert.AreEqual( "nl", info.Languages[7].Name, "language" );
            Assert.AreEqual( "SciFi", info.Genres[19].Name, "genre" );
            Assert.AreEqual( "Dexter > Season 8", info.Series[129].FullName, "series" );
        }
    }
}
