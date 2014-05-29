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
        /// <returns>Eine Liste passender Ergebnisse.</returns>
        [HttpGet]
        [Route( "" )]
        public SearchInformation ShowList()
        {
            return ShowList( null );
        }

        /// <summary>
        /// Führt eine einfache Suche durch.
        /// </summary>
        /// <param name="request">Die Beschreibung der auszuführenden Suche.</param>
        /// <returns>Eine Liste passender Ergebnisse.</returns>
        [HttpPost]
        [Route( "" )]
        public SearchInformation ShowList( [FromBody] SearchRequest request )
        {
            // Default
            if (request == null)
                request = new SearchRequest();

            // Prepare
            request.Validate();

            // Root query
            var recordings =
                DatabaseContext
                    .Recordings
                    .Query()
                    .Apply( request );

            // Time to execute
            return
                new SearchInformation
                {
                    TotalCount = DatabaseContext.Recordings.Query().Count(),
                    Recordings = recordings.ToArray(),
                    PageIndex = request.PageIndex,
                    PageSize = request.PageSize,
                };
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
            if (!DatabaseContext.TestEmpty())
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
            // Just improve lookup speed a bit - hey, EF is not so fast...
            var containerMap = new Dictionary<string, Container>();
            var languageMap = new Dictionary<string, Language>();
            var genreMap = new Dictionary<string, Genre>();

            // Add all containers
            var dbContainers = DatabaseContext.Containers;
            foreach (var container in legacyDatabaseContent.Containers)
                containerMap.Add( container.Name,
                    dbContainers.Add(
                        new Container
                        {
                            Type = (ContainerType) container.Type,
                            Description = container.Location,
                            Name = container.Name,
                        } ) );

            // Assign parent containers
            foreach (var container in legacyDatabaseContent.Containers.Where( c => c.Parent != null ))
            {
                var dbContainer = containerMap[container.Name];
                var parent = container.Parent;

                dbContainer.ParentContainer = containerMap[parent.Name];
                dbContainer.ParentPosition = parent.UnitIdentifier;
            }

            // Add all languages
            var dbLanguages = DatabaseContext.Languages;
            foreach (var language in new HashSet<string>( legacyDatabaseContent.Languages.Select( l => l.ToLower() ) ))
                languageMap.Add( language, dbLanguages.Add( new Language { ShortName = language, LongName = language } ) );

            // Add all genres
            var dbGenres = DatabaseContext.Genres;
            foreach (var genre in new HashSet<string>( legacyDatabaseContent.Genres ))
                genreMap.Add( genre, dbGenres.Add( new Genre { Name = genre } ) );

            // Add all recordings
            var dbRecordings = DatabaseContext.Recordings;
            foreach (var recording in legacyDatabaseContent.Recordings.Take( 100 ))
                dbRecordings.Add(
                    new Recording
                    {
//                        Languages = recording.Languages.Select( language => languageMap[language.ToLower()] ).ToList(),
//                        Genres = recording.Genres.Select( genre => genreMap[genre] ).ToList(),
                        Title = recording.Title,
                        Id = recording.UniqueId,
                    } );
        }
    }
}