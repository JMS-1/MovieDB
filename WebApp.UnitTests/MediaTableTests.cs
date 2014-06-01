using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using NUnit.Framework;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft den Umgang mit der Tabelle der physikalischen Medien.
    /// </summary>
    [TestFixture]
    public class MediaTableTests : DatabaseTestBase
    {
        /// <summary>
        /// Liest alle Medien ein.
        /// </summary>
        [Test]
        public void CanReadMedia()
        {
            TestContext.Media.ToArray();
        }

        /// <summary>
        /// Liest alle Medien mit Aufbewahrungsinformation ein.
        /// </summary>
        [Test]
        public void CanReadMediaWithContainer()
        {
            TestContext.Media.Include( m => m.Container ).ToArray();
        }
    }
}
