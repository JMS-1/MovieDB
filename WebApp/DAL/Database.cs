using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Data.SqlClient;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using WebApp.Models;


namespace WebApp.DAL
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
            // First try is to do all database stuff manually - have to check how easy triggers can be integrated in auto-versioning
            System.Data.Entity.Database.SetInitializer<Database>( null );
        }

        /// <summary>
        /// Erstellt eine neue Zugriffsinstanz auf die Datenbank.
        /// </summary>
        public Database()
            : base( _DatabaseConnectionString )
        {
            // Enforce full control on SQL commands - known as "DO WHAT I SAY" :-)
            Configuration.LazyLoadingEnabled = false;

            // Only executed when compiled in DEBUG mode
            if (Debugger.IsAttached)
                RegisterLogger();
        }

        /// <summary>
        /// Prüft eine Entität.
        /// </summary>
        /// <param name="entityEntry">Die zu prüfende Entität.</param>
        /// <param name="items">Alle geänderten Entitäten.</param>
        /// <returns>Das Ergebnis der Prüfung.</returns>
        protected override DbEntityValidationResult ValidateEntity( DbEntityEntry entityEntry, IDictionary<object, object> items )
        {
            // Links must be numbered
            var linkHolder = entityEntry.Entity as ILinkHolder;
            if (linkHolder != null)
            {
                var index = 0;

                foreach (var link in linkHolder.Links ?? Enumerable.Empty<Link>())
                    link.Index = index++;
            }

            return base.ValidateEntity( entityEntry, items );
        }

        /// <summary>
        /// Der Name unserer Datenbank.
        /// </summary>
        private static string _DatabaseName;

        /// <summary>
        /// Der volle Pfad zur Datenbank.
        /// </summary>
        private static string _DatabasePath;

        /// <summary>
        /// Die vollen Verbindungsinformationen zur Datenbank.
        /// </summary>
        private static string _DatabaseConnectionString;

        /// <summary>
        /// Zum Zugriff über den SQL Server - zurzeit gekoppelt an SQL Express 2014ff
        /// </summary>
        private const string _LocalDb = @"Data Source=(LocalDB)\MSSQLLocalDB;Integrated Security=True";

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
        /// Die physikalischen Medien, auf denen die Aufzeichnungen abgelegt sind.
        /// </summary>
        public DbSet<Store> Stores { get; set; }

        /// <summary>
        /// Alle Serien oder Gruppen zusammen gehörender Aufzeichnungen.
        /// </summary>
        public DbSet<Series> Series { get; set; }

        /// <summary>
        /// Alle Verweise.
        /// </summary>
        public DbSet<Link> Links { get; set; }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        protected override void OnModelCreating( DbModelBuilder modelBuilder )
        {
            // Each type of entity gets the chance to fine tune its behaviour
            Models.Recording.BuildModel( modelBuilder );
            Models.Container.BuildModel( modelBuilder );
            Models.Language.BuildModel( modelBuilder );
            Models.Series.BuildModel( modelBuilder );
            Models.Store.BuildModel( modelBuilder );
            Models.Genre.BuildModel( modelBuilder );
            Models.Link.BuildModel( modelBuilder );

            base.OnModelCreating( modelBuilder );
        }

        /// <summary>
        /// Gesetzt, wenn in keiner der Tabellen Einträge vorhanden sind.
        /// </summary>
        public bool IsEmpty
        {
            get
            {
                // In regular operation mode the first call will get the answer
                if (Recordings.Any())
                    return false;
                if (Languages.Any())
                    return false;
                if (Genres.Any())
                    return false;
                if (Containers.Any())
                    return false;
                if (Stores.Any())
                    return false;
                if (Series.Any())
                    return false;
                if (Links.Any())
                    return false;

                return true;
            }
        }

        /// <summary>
        /// Entfernt die Datenbank aus der Verwaltung - dieser Aufruf wird hauptsächlich für die Tests
        /// verwendet.
        /// </summary>
        public static void DetachFromDatabase()
        {
            // Remember and test
            if (string.IsNullOrEmpty( _DatabasePath ))
                return;
            if (!File.Exists( _DatabasePath ))
                return;

            // Connect to master database
            using (var connection = new SqlConnection( _LocalDb + @";Initial Catalog=master" ))
            {
                connection.Open();

                // Create the database
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = string.Format( "SELECT DB_ID('{0}')", _DatabaseName );
                    if (cmd.ExecuteScalar() == DBNull.Value)
                        return;

                    // Must detach first
                    cmd.CommandText = string.Format( "exec sp_detach_db '{0}'", _DatabaseName );
                    cmd.ExecuteNonQuery();
                }
            }

        }

        /// <summary>
        /// Legt einmalig die Datenbank an.
        /// </summary>
        /// <param name="pathToDatabase">Der volle Pfad zur Datenbank.</param>
        /// <param name="databaseName">Der Name der Datenbank.</param>
        public static void CreateOnce( string pathToDatabase, string databaseName = null )
        {
            _DatabaseConnectionString = string.Format( _LocalDb + @";AttachDbFilename={0};MultipleActiveResultSets=True", pathToDatabase );
            _DatabaseName = databaseName ?? "JmsMovieDb10";

            // Remember and test
            if (File.Exists( _DatabasePath = pathToDatabase ))
                using (var connection = new SqlConnection( _DatabaseConnectionString ))
                {
                    connection.Open();

                    using (var cmd = connection.CreateCommand())
                    {
                        cmd.CommandText = string.Format( "SELECT DB_NAME()" );

                        // Ask the database for or name
                        _DatabaseName = (string) cmd.ExecuteScalar();
                    }

                    return;
                }

            // Connect to master database
            using (var connection = new SqlConnection( _LocalDb + @";Initial Catalog=master" ))
            {
                connection.Open();

                // Create the database
                using (var cmd = connection.CreateCommand())
                {
                    // Must detach first
                    cmd.CommandText = string.Format( "SELECT DB_ID('{0}')", _DatabaseName );
                    if (cmd.ExecuteScalar() != DBNull.Value)
                    {
                        cmd.CommandText = string.Format( "exec sp_detach_db '{0}'", _DatabaseName );
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