using NUnit.Framework;
using WebApp.Controllers;


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
        }
    }
}
