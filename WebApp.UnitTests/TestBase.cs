using System;
using System.Data.SqlClient;
using System.IO;
using NUnit.Framework;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Hilfsklasse für alle Tests, die mit der produktiven Datenbank arbeiten sollen.
    /// </summary>
    public abstract class TestBase
    {
        /// <summary>
        /// In diesem Verzeichnis wird die Datenbank angelegt.
        /// </summary>
        private readonly DirectoryInfo m_scratch = new DirectoryInfo( Path.Combine( Path.GetTempPath(), Guid.NewGuid().ToString() ) );

        /// <summary>
        /// Wird einmalig vor dem ersten Test aufgerufen.
        /// </summary>
        [TestFixtureSetUp]
        public virtual void BeforeFirstTest()
        {
            m_scratch.Create();

            File.WriteAllBytes( Path.Combine( m_scratch.FullName, "database.sql" ), Properties.Resources.sqlScript );

            Database.CreateOnce( Path.Combine( m_scratch.FullName, "unittest.mdf" ), "MovieDbForUnitTest" );
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
