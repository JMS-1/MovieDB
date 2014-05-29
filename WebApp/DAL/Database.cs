using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
using System.Diagnostics;
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
            : base( "ConnectionX" )
        {
            RegisterLogger();
        }

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
        }
    }
}