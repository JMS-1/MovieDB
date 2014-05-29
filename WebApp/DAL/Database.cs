using System;
using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
using System.Data.SqlClient;
using System.Diagnostics;
using System.IO;
using System.Text;
using WebApp.Models;


namespace WebApp
{
    /// <summary>
    /// Beschreibt unsere Datenbank.
    /// </summary>
    public class Database : DbContext
    {
        /// <summary>
        /// Führt einmalig Aktualisierungen aus.
        /// </summary>
        static Database()
        {
            System.Data.Entity.Database.SetInitializer<Database>( null );
        }

        /// <summary>
        /// Erstellt eine neue Zugriffsinstanz auf die Datenbank.
        /// </summary>
        public Database()
        {
            RegisterLogger();
        }

        /// <summary>
        /// Der Name unserer Datenbank.
        /// </summary>
        private const string _DatabaseName = "JmsMovieDb10";

        /// <summary>
        /// Der volle Pfad zur Datenbank.
        /// </summary>
        private static string _DatabasePath;

        /// <summary>
        /// Die vollen Verbindungsinformationen zur Datenbank.
        /// </summary>
        private static string _DatabaseConnectionString;

        /// <summary>
        /// Aktiviert im Testmodus die Ausgaber aller SQL Befehle.
        /// </summary>
        [Conditional( "DEBUG" )]
        private void RegisterLogger()
        {
            Database.Log += sqlCommand => Trace.TraceInformation( "SQL {0}", sqlCommand );
        }

        /// <summary>
        /// Verwaltet die Aufnahmen.
        /// </summary>
        public DbSet<Recording> Recordings { get; set; }

        /// <summary>
        /// Verwaltet die Tonspuren.
        /// </summary>
        public DbSet<Language> Languages { get; set; }

        /// <summary>
        /// Verwaltet die Aufnahmearten.
        /// </summary>
        public DbSet<Genre> Genres { get; set; }

        /// <summary>
        /// Alle konkreten Aufbewahrungen.
        /// </summary>
        public DbSet<Container> Containers { get; set; }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        protected override void OnModelCreating( DbModelBuilder modelBuilder )
        {
            modelBuilder.Conventions.Remove<PluralizingTableNameConvention>();
        }

        /// <summary>
        /// Legt einmalig die Datenbank an.
        /// </summary>
        /// <param name="pathToDatabase">Der volle Pfad zur Datenbank.</param>
        public static void CreateOnce( string pathToDatabase )
        {
            _DatabaseConnectionString = string.Format( @"Data Source=(LocalDB)\v11.0;AttachDbFilename={0};Integrated Security=True", pathToDatabase );

            // Remember and test
            if (File.Exists( _DatabasePath = pathToDatabase ))
                return;

            // Connect to master database
            using (var connection = new SqlConnection( @"Data Source=(LocalDB)\v11.0;Initial Catalog=master;Integrated Security=True" ))
            {
                connection.Open();

                // Create the database
                using (var cmd = connection.CreateCommand())
                {
                    // Must detach first
                    cmd.CommandText = string.Format( "SELECT DB_ID('{0}')", _DatabaseName );
                    if (cmd.ExecuteScalar() != DBNull.Value)
                    {
                        cmd.CommandText = string.Format( "exec sp_detach_db '{0}', 'true'", _DatabaseName );
                        cmd.ExecuteNonQuery();
                    }

                    // Create new
                    cmd.CommandText = string.Format( "CREATE DATABASE {0} ON (NAME = N'{0}', FILENAME = '{1}')", _DatabaseName, _DatabasePath );
                    cmd.ExecuteNonQuery();
                }
            }

            // Prepare to run script
            var script = File.ReadAllLines( Path.Combine( Path.GetDirectoryName( _DatabasePath ), "database.sql" ) );
            var command = new StringBuilder();

            // Start processing script
            using (var connection = new SqlConnection( _DatabaseConnectionString ))
            {
                connection.Open();

                using (var cmd = connection.CreateCommand())
                    foreach (var line in script)
                    {
                        var comment = line.IndexOf( "--" );
                        var active = (comment < 0) ? line : line.Substring( 0, comment );

                        if (StringComparer.InvariantCultureIgnoreCase.Equals( active.Trim(), "GO" ))
                        {
                            cmd.CommandText = command.ToString();
                            cmd.ExecuteNonQuery();

                            command.Length = 0;
                        }
                        else
                        {
                            command.Append( ' ' );
                            command.Append( active );
                        }
                    }
            }
        }
    }
}