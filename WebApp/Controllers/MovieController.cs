using System;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using System.Xml.Serialization;
using Newtonsoft.Json;
using WebApp.DAL;
using WebApp.DTO;


namespace WebApp.Controllers
{
    /// <summary>
    /// Die Schnittstelle auf die verwalteten Filme.
    /// </summary>
    [RoutePrefix( "movie/db" )]
    public class MovieController : ControllerWithDatabase
    {
        /// <summary>
        /// Kann die alte Darstellung deserialisieren.
        /// </summary>
        private static readonly XmlSerializer _LegacyDeserializer = new XmlSerializer( typeof( MovieDB.Database ), MovieDB.Database.DatabaseNamespace );

        /// <summary>
        /// Kann JSON deserialisieren.
        /// </summary>
        private static readonly JsonSerializer _JsonDeserializer = new JsonSerializer();

        /// <summary>
        /// Führt eine einfache Suche durch.
        /// </summary>
        /// <returns>Eine Liste passender Ergebnisse.</returns>
        [HttpGet]
        [Route( "query" )]
        public SearchInformation Query()
        {
            return Query( null );
        }

        /// <summary>
        /// Führt eine einfache Suche durch.
        /// </summary>
        /// <param name="request">Die Beschreibung der auszuführenden Suche.</param>
        /// <returns>Eine Liste passender Ergebnisse.</returns>
        [HttpPost]
        [Route( "query" )]
        public SearchInformation Query( [FromBody] SearchRequest request )
        {
            // Default
            if (request == null)
                request = new SearchRequest();

            // Prepare
            request.Validate();

            // Create response
            var response = new SearchInformation { PageIndex = request.PageIndex, PageSize = request.PageSize };

            // Root query
            var recordings =
                Database
                    .Apply( request, response )
                    .Include( r => r.Languages )
                    .Include( r => r.Genres );

            // Time to execute
            response.Recordings = recordings.Select( RecordingForTable.Create ).ToArray();

            // Report
            return response;
        }

        /// <summary>
        /// Ermittelt eine einzelne Aufzeichnung.
        /// </summary>
        /// <param name="identifier">Die eindeutige Kennung der Aufzeichnung.</param>
        /// <returns>Die gewünschte Aufzeichnung.</returns>
        [Route( "{identifier}" )]
        [HttpGet]
        public RecordingEditInfo Find( Guid identifier )
        {
            // Find with relations loaded - to include relation targets we have to use a query instead of a simple find (remember: auto query is switched off)
            var recording =
                Database
                    .Recordings
                    .Include( r => r.Languages )
                    .Include( r => r.Genres )
                    .Include( r => r.Store )
                    .Include( r => r.Links )
                    .SingleOrDefault( r => r.UniqueIdentifier == identifier );

            // Report
            if (recording == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );
            else
                return RecordingEditInfo.Create( recording );
        }

        /// <summary>
        /// Reduziert eine Zeichenkette auf den eigentlichen Inhalt.
        /// </summary>
        /// <param name="data">Eine Zeichenkette.</param>
        /// <returns>Die reduzierte Zeichenkette.</returns>
        private static string GetEmptyAsNull( string data )
        {
            return string.IsNullOrWhiteSpace( data ) ? null : data.Trim();
        }

        /// <summary>
        /// Ändert die Daten einer Aufzeichnung.
        /// </summary>
        /// <param name="identifier">Die gewünschte Aufzeichnung.</param>
        /// <param name="newData">Die neue Daten.</param>
        [Route( "{identifier}" )]
        [HttpPut]
        public async Task<IHttpActionResult> Update( Guid identifier, [FromBody] RecordingEditCore newData )
        {
            // Locate
            var recording = Database.Recordings.Include( r => r.Languages ).Include( r => r.Genres ).Include( r => r.Links ).SingleOrDefault( r => r.UniqueIdentifier == identifier );
            if (recording == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            // Reset languages
            recording.Languages.Clear();
            foreach (var language in Database.Languages.Where( l => newData.Languages.Contains( l.UniqueIdentifier ) ))
                recording.Languages.Add( language );

            // Reset genres
            recording.Genres.Clear();
            foreach (var genre in Database.Genres.Where( g => newData.Genres.Contains( g.UniqueIdentifier ) ))
                recording.Genres.Add( genre );

            // Reset links
            recording.Links.Clear();
            foreach (var link in newData.Links)
                recording.Links.Add( link.ToModel() );

            // Enforce validation for links
            Database.Entry( recording ).State = EntityState.Modified;

            // Copy all
            recording.Description = GetEmptyAsNull( newData.Description );
            recording.RentTo = GetEmptyAsNull( newData.RentTo );
            recording.Name = GetEmptyAsNull( newData.Name );
            recording.SeriesIdentifier = newData.Series;
            recording.Store = GetOrCreateStore( newData );

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Ermittelt eine exisierenden physikalische Ablage und legt bei Bedarf eine neue an.
        /// </summary>
        /// <param name="recording">Die Daten zur Ablage.</param>
        /// <returns>Die gewünschte Ablage.</returns>
        private Models.Store GetOrCreateStore( RecordingEditCore recording )
        {
            // Relative location
            var location = GetEmptyAsNull( recording.Location );

            // Try to locate in database
            var store =
                Database
                    .Stores
                    .FirstOrDefault( s => s.ContainerIdentifier == recording.Container && s.Location == location && s.Type == recording.StoreType );

            // Report existing or newly created one
            if (store != null)
                return store;
            else
                return new Models.Store { ContainerIdentifier = recording.Container, Location = location, Type = recording.StoreType };
        }

        /// <summary>
        /// Legt eine neue Aufzeichnung an.
        /// </summary>
        /// <param name="newData">Die Daten der Aufzeichnung.</param>
        /// <returns>Steuerung des Ergebnisses.</returns>
        [Route( "" )]
        [HttpPost]
        public async Task<IHttpActionResult> Update( [FromBody] RecordingEditCore newData )
        {
            // Create
            var recording = new Models.Recording
            {
                Description = GetEmptyAsNull( newData.Description ),
                RentTo = GetEmptyAsNull( newData.RentTo ),
                Name = GetEmptyAsNull( newData.Name ),
                Store = GetOrCreateStore( newData ),
                SeriesIdentifier = newData.Series,
                CreationTime = DateTime.UtcNow,
            };

            // Remember it - must be done before we try to add links or EF will not be able to create the foreign key reference correctly
            Database.Recordings.Add( recording );

            // Multi-value collections
            recording.Languages = Database.Languages.Where( l => newData.Languages.Contains( l.UniqueIdentifier ) ).ToList();
            recording.Genres = Database.Genres.Where( g => newData.Genres.Contains( g.UniqueIdentifier ) ).ToList();
            recording.Links = newData.Links.Select( l => l.ToModel() ).ToList();

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Löscht eine Aufzeichnung.
        /// </summary>
        /// <param name="identifier">Die eindeutige Kennung der Aufzeichnung.</param>
        /// <returns>Die Steuerung des Zugriffs.</returns>
        [Route( "{identifier}" )]
        [HttpDelete]
        public async Task<IHttpActionResult> Delete( Guid identifier )
        {
            // Mark as deleted
            Database.Entry( new Models.Recording { UniqueIdentifier = identifier } ).State = EntityState.Deleted;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
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
            if (!Database.IsEmpty)
                throw new HttpResponseException( HttpStatusCode.Forbidden );

            // Decode
            var decoder = await formData.ReadAsMultipartAsync();

            // Process uploaded files
            foreach (var data in decoder.Contents)
            {
                // Check the name
                if (!StringComparer.InvariantCultureIgnoreCase.Equals( data.Headers.ContentDisposition.Name, "\"legacyFile\"" ))
                    continue;

                // Read the stream
                using (var stream = await data.ReadAsStreamAsync())
                {
                    // And parse the former object model
                    var legacy = (MovieDB.Database) _LegacyDeserializer.Deserialize( stream );

                    // Fill up
                    legacy.CopyTo( Database );

                    // Store
                    await Database.SaveChangesAsync();
                }
            }

            // Must provide proper synchronisation code for the framework to run the request
            return Redirect( Url.Content( "../../default.html" ) );
        }

        /// <summary>
        /// Wird aufgerufen, um eine Sicherungskopie der Datenbank anzulegen.
        /// </summary>
        /// <returns>Die Steuerung des asynchronen Aufrufs.</returns>
        [Route( "backup" )]
        [HttpPost]
        public async Task<IHttpActionResult> CreateBackup()
        {
            // All paths
            var databaseFile = DAL.Database.DatabasePath;
            var backupFile = Path.ChangeExtension( databaseFile, ".bak" );
            var backupCopy = Path.Combine( Path.GetDirectoryName( backupFile ), Path.GetFileNameWithoutExtension( backupFile ) + " (previous)" + Path.GetExtension( backupFile ) );

            // Copy current backup
            if (File.Exists( backupFile ))
                File.Copy( backupFile, backupCopy, true );

            // Attach to the raw database connection
            var connection = Database.Database.Connection;

            // Open the connection
            connection.Open();

            // Make sure we close it
            try
            {
                using (var command = connection.CreateCommand())
                {
                    // Configure
                    command.CommandText = string.Format( "BACKUP DATABASE [{0}] TO DISK = '{1}' WITH FORMAT", DAL.Database.DatabaseName, backupFile.Replace( "'", "''" ) );

                    // Process
                    await command.ExecuteNonQueryAsync();
                }
            }
            finally
            {
                connection.Close();
            }

            // Done
            return Ok();
        }

        /// <summary>
        /// Führt eine einfache Suche durch.
        /// </summary>
        /// <param name="request">Die Beschreibung der auszuführenden Suche.</param>
        /// <returns>Eine Liste passender Ergebnisse.</returns>
        [HttpPost]
        [Route( "export" )]
        public async Task<HttpResponseMessage> Export( HttpRequestMessage request )
        {
            // Default
            var formData = await request.Content.ReadAsFormDataAsync();

            // We have to decode by hand because we are using FORM INPUT and redirection - not a problem at all!
            SearchRequest searchRequest;
            using (var reader = new StringReader( formData["request"] ))
            using (var json = new JsonTextReader( reader ))
                searchRequest = _JsonDeserializer.Deserialize<SearchRequest>( json );

            // Root query
            var recordings =
                await Database
                    .Apply( searchRequest, null )
                    .Include( r => r.Languages )
                    .Include( r => r.Genres )
                    .ToArrayAsync();

            // Create result
            using (var memoryStream = new MemoryStream())
            using (var writer = new StreamWriter( memoryStream, Encoding.UTF8 ))
            {
                // Format
                const string format = "{0};{1};{2}";

                // Header
                writer.WriteLine( format, "Name", "Sprachen", "Kategorien" );

                // Data
                foreach (var recording in recordings)
                    writer.WriteLine
                        (
                            format,
                            GetExportString( recording.FullName ),
                            GetExportString( string.Join( "; ", recording.Languages.Select( l => l.Name ) ) ),
                            GetExportString( string.Join( "; ", recording.Genres.Select( g => g.Name ) ) )
                        );

                // Finish
                writer.Flush();

                // Create response
                var response = new HttpResponseMessage { Content = new StreamContent( new MemoryStream( memoryStream.ToArray(), false ) ) };

                // Configure it
                response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue( "attachment" ) { FileName = "export.csv" };
                response.Content.Headers.ContentType = new MediaTypeHeaderValue( "text/csv" ) { CharSet = "utf-8" };

                // Send to client
                return response;
            }
        }

        /// <summary>
        /// Erstellt aus einer Zeichenkette eine Darstellung passend für einen Export nach <i>Excel</i>.
        /// </summary>
        /// <param name="rawValue">Die orginale Zeichenkette.</param>
        /// <returns>Die Zeichenkette für Excel.</returns>
        private static string GetExportString( string rawValue )
        {
            if (string.IsNullOrEmpty( rawValue ))
                return string.Empty;
            else
                return string.Format( "\"{0}\"", rawValue.Replace( "\t", " " ).Replace( "\r", " " ).Replace( "\n", " " ).Replace( "\"", "\"\"" ) );
        }
    }
}