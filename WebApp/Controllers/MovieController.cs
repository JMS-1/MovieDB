using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Xml.Serialization;
using WebApp.DAL;
using WebApp.Models;


namespace WebApp.Controllers
{
    /// <summary>
    /// Die Schnittstelle auf die verwalteten Filme.
    /// </summary>
    [RoutePrefix( "movie/db" )]
    public class MovieController : ApiController
    {
        /// <summary>
        /// Kann die alte Darstellung deserialisieren.
        /// </summary>
        private static readonly XmlSerializer _LegacyDeserializer = new XmlSerializer( typeof( MovieDB.Database ), MovieDB.Database.DatabaseNamespace );

        /// <summary>
        /// Wir benötigen Zugriff auf die Datenbank.
        /// </summary>
        public IRequestContext DatabaseContext { get; private set; }

        /// <summary>
        /// Erzeugt für jeden Zugriff eine neue Instanz zum Zugriff auf die Daten.
        /// </summary>
        /// <param name="context">Abstraktion des Datenbankzugriffs.</param>
        /// <exception cref="ArgumentException">Auch in Testszenarien muss eine Datenbankabstraktion
        /// angegeben werden.</exception>
        public MovieController( IRequestContext context )
        {
            // Just in case we forget...
            if (context == null)
                throw new ArgumentException( "keine Datenbank", "context" );

            DatabaseContext = context;
        }

        /// <summary>
        /// Führt eine einfache Suche durch.
        /// </summary>
        /// <param name="pageSize">Die Anzahl der Ergebnisse pro Seite.</param>
        /// <param name="pageIndex">Die aktuell zu verwendende Seite.</param>
        /// <returns>Eine Liste passender Ergebnisse.</returns>
        [HttpGet]
        [Route( "" )]
        public Recording[] ShowList( int pageSize = 10, int pageIndex = 0 )
        {
            // Validate parameters
            if (pageSize < 1)
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadPageSize );
            if (pageSize > 250)
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadPageSize );
            if (pageIndex < 0)
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadPageIndex );

            // Full check against limit
            var offset = (long) pageIndex * (long) pageSize;
            if ((offset + pageSize) > int.MaxValue)
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadPageIndex );

            // Root query
            var recordings = DatabaseContext.Recordings.Query();

            // Apply order
            recordings = recordings.OrderBy( recording => recording.Title );

            // Apply start offset
            if (offset > 0)
                recordings = recordings.Skip( (int) offset );

            // Always restrict number of results
            recordings = recordings.Take( pageSize );

            // Get the total count
            var total = DatabaseContext.Recordings.Query().Count();

            // Time to execute
            return recordings.ToArray();
        }

        /// <summary>
        /// Füllt eine leere Datenbank aus der alten Serialisierungsform.
        /// </summary>
        [Route( "initialize" )]
        [HttpPost]
        public async Task<IHttpActionResult> UploadLegacyDatabase()
        {
            // See if correct encapsulation is used
            var formData = Request.Content;
            if (!formData.IsMimeMultipartContent( "form-data" ))
                throw new HttpResponseException( HttpStatusCode.UnsupportedMediaType );

            // Can only initialize an empty database
            if (DatabaseContext.Recordings.Query().Any())
                throw new HttpResponseException( HttpStatusCode.Forbidden );
            if (DatabaseContext.Languages.Query().Any())
                throw new HttpResponseException( HttpStatusCode.Forbidden );

            // Decode
            var decoder = await formData.ReadAsMultipartAsync();

            // Process uploaded files
            foreach (var data in decoder.Contents)
            {
                // Check the name
                if (!StringComparer.InvariantCultureIgnoreCase.Equals( data.Headers.ContentDisposition.Name, @"""legacyFile""" ))
                    continue;

                // Read the stream
                using (var stream = await data.ReadAsStreamAsync())
                {
                    // And parse the former object model
                    var legacy = (MovieDB.Database) _LegacyDeserializer.Deserialize( stream );

                    // Prepare in memory dictionaries
                    legacy.CreateMaps();

                    // Fill up
                    Initialize( legacy );

                    // Store
                    await DatabaseContext.BeginSave();
                }
            }

            // Must provide proper synchronisation code for the framework to run the request
            return Ok();
        }

        /// <summary>
        /// Initialisiert die Datenbank.
        /// </summary>
        /// <param name="legacyDatabaseContent">Die in die Datenbank zu übernehmenden Objekte.</param>
        private void Initialize( MovieDB.Database legacyDatabaseContent )
        {
            var languageMap = new Dictionary<string, Language>();

            var dbLanguages = DatabaseContext.Languages;
            foreach (var language in new HashSet<string>( legacyDatabaseContent.Languages.Select( l => l.ToLower() ) ))
                languageMap.Add( language, dbLanguages.Add( new Language { Short = language, Long = language, } ) );

            var dbRecordings = DatabaseContext.Recordings;
            foreach (var recording in legacyDatabaseContent.Recordings.Take( 100 ))
                dbRecordings.Add(
                        new Recording
                        {
                            Languages = recording.Languages.Select( language => languageMap[language.ToLower()] ).ToList(),
                            Title = recording.Title,
                            Id = recording.UniqueId,
                        } );
        }
    }
}