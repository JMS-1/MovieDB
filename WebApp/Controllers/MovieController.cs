using System;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Xml.Serialization;
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
            // Find with relations loaded
            var recording =
                Database
                    .Recordings
                    .Include( r => r.Languages )
                    .Include( r => r.Genres )
                    .Include( r => r.Store )
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
        public async Task<IHttpActionResult> Update( Guid identifier, [FromBody] RecordingEditInfo newData )
        {
            // Locate
            var recording = Database.Recordings.Include( r => r.Languages ).Include( r => r.Genres ).SingleOrDefault( r => r.UniqueIdentifier == identifier );
            if (recording == null)
                throw new HttpResponseException( HttpStatusCode.NotFound );

            var location = GetEmptyAsNull( newData.Location );

            // Reset languages
            recording.Languages.Clear();
            foreach (var language in Database.Languages.Where( l => newData.Languages.Contains( l.UniqueIdentifier ) ))
                recording.Languages.Add( language );

            // Reset genres
            recording.Genres.Clear();
            foreach (var genre in Database.Genres.Where( g => newData.Genres.Contains( g.UniqueIdentifier ) ))
                recording.Genres.Add( genre );

            // Copy all
            recording.Store = Database.Stores.FirstOrDefault( s => s.ContainerIdentifier == newData.Container && s.Location == location && s.Type == newData.StoreType ) ?? new Models.Store { ContainerIdentifier = newData.Container, Location = location, Type = newData.StoreType };
            recording.Description = GetEmptyAsNull( newData.Description );
            recording.RentTo = GetEmptyAsNull( newData.RentTo );
            recording.Name = GetEmptyAsNull( newData.Name );
            recording.SeriesIdentifier = newData.Series;

            // Process update
            await Database.SaveChangesAsync();

            // Done
            return Ok();
        }

        /// <summary>
        /// Legt eine neue Aufzeichnung an.
        /// </summary>
        /// <param name="newData">Die Daten der Aufzeichnung.</param>
        /// <returns>Steuerung des Ergebnisses.</returns>
        [Route( "" )]
        [HttpPost]
        public async Task<IHttpActionResult> Update( [FromBody] RecordingEditInfo newData )
        {
            // Create
            var location = GetEmptyAsNull( newData.Location );
            var recording = new Models.Recording
            {
                Store = Database.Stores.FirstOrDefault( s => s.ContainerIdentifier == newData.Container && s.Location == location && s.Type == newData.StoreType ) ?? new Models.Store { ContainerIdentifier = newData.Container, Location = location, Type = newData.StoreType },
                Description = GetEmptyAsNull( newData.Description ),
                RentTo = GetEmptyAsNull( newData.RentTo ),
                Name = GetEmptyAsNull( newData.Name ),
                SeriesIdentifier = newData.Series,
                CreationTime = DateTime.UtcNow,
            };

            // Multi-value collections
            recording.Languages = Database.Languages.Where( l => newData.Languages.Contains( l.UniqueIdentifier ) ).ToList();
            recording.Genres = Database.Genres.Where( g => newData.Genres.Contains( g.UniqueIdentifier ) ).ToList();

            // Remember it
            Database.Recordings.Add( recording );

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
                if (!StringComparer.InvariantCultureIgnoreCase.Equals( data.Headers.ContentDisposition.Name, @"""legacyFile""" ))
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
            return Ok();
        }
    }
}