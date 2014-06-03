using System;
using System.Data.SqlClient;
using System.IO;
using System.IO.Compression;
using NUnit.Framework;
using WebApp.DAL;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Hilfsklasse für alle Tests, die mit einer gefüllten Datenbank arbeiten sollen.
    /// </summary>
    public abstract class SampleDatabaseTestBase
    {
        /// <summary>
        /// In diesem Verzeichnis wird die Datenbank angelegt.
        /// </summary>
        private readonly DirectoryInfo m_scratch = new DirectoryInfo( Path.Combine( Path.GetTempPath(), Guid.NewGuid().ToString() ) );

        /// <summary>
        /// Wird für jede Testmethode neu angelegt.
        /// </summary>
        protected Database TestContext;

        /// <summary>
        /// Wird vor jeder Testmethode aufgerufen.
        /// </summary>
        [SetUp]
        public virtual void BeforeEachTest()
        {
            Recreate();
        }

        /// <summary>
        /// Erstellt eine neue Verbindung zur Datenbank.
        /// </summary>
        protected void Recreate()
        {
            using (TestContext)
                TestContext = new Database();
        }

        /// <summary>
        /// Wird nach jeder Testmethode aufgerufen.
        /// </summary>
        [TearDown]
        public virtual void AfterEachTest()
        {
            using (TestContext)
                TestContext = null;
        }

        /// <summary>
        /// Wird einmalig vor dem ersten Test aufgerufen.
        /// </summary>
        [TestFixtureSetUp]
        public virtual void BeforeFirstTest()
        {
            m_scratch.Create();

            using (var sampleDb = new MemoryStream( Properties.Resources.SampleDatabase ))
            using (var archive = new ZipArchive( sampleDb ))
                archive.ExtractToDirectory( m_scratch.FullName );

            Database.CreateOnce( Path.Combine( m_scratch.FullName, "movie.mdf" ) );
        }

        /// <summary>
        /// Beendet den Test endgültig.
        /// </summary>
        [TestFixtureTearDown]
        public virtual void AfterLastTest()
        {
            if (!m_scratch.Exists)
                return;

            // Make sure we are not locking the database
            SqlConnection.ClearAllPools();
            Database.DetachFromDatabase();

            m_scratch.Delete( true );
        }
    }
}
