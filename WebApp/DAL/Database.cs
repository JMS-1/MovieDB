using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
using System.Diagnostics;
using WebApp.Models;


namespace WebApp
{
    public class Database : DbContext
    {
        public Database()
            : base( "Connection" )
        {
            RegisterLogger();
        }

        [Conditional( "DEBUG" )]
        private void RegisterLogger()
        {
            Database.Log += sqlCommand => Trace.TraceInformation( "SQL {0}", sqlCommand );
        }

        public DbSet<Recording> Recordings { get; set; }

        public DbSet<Language> Languages { get; set; }

        protected override void OnModelCreating( DbModelBuilder modelBuilder )
        {
            modelBuilder.Conventions.Remove<PluralizingTableNameConvention>();
        }
    }
}