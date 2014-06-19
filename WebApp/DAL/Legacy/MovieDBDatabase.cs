using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;


namespace MovieDB
{
    /// <summary>
    /// Realisiert eine .NET Struktur für die als XML serialisierte Datenbank von Aufzeichnungen und erweiterten
    /// Informationen zu diesen.
    /// </summary>
    [
        Serializable,
        XmlType( "MediaDB" )
    ]
    public class Database
    {
        /// <summary>
        /// Der Schlüssel für eine physikalische Ablage.
        /// </summary>
        private struct StoreKey : IEquatable<StoreKey>
        {
            /// <summary>
            /// Der Name der Aufbewahrung.
            /// </summary>
            private readonly string m_container;

            /// <summary>
            /// Die relative Position in der Aufbewahrung.
            /// </summary>
            public readonly string Location;

            /// <summary>
            /// Die Art der Aufbewahrung.
            /// </summary>
            public readonly WebApp.Models.StoreType Type;

            /// <summary>
            /// Ein Kurzschlüssel.
            /// </summary>
            private readonly int m_hash;

            /// <summary>
            /// Erstellt einen Schlüssel.
            /// </summary>
            /// <param name="media">Die physikalische Ablage.</param>
            public StoreKey( Media media )
            {
                if (media == null)
                {
                    Type = WebApp.Models.StoreType.Undefined;
                    m_container = string.Empty;
                    Location = string.Empty;
                }
                else
                {
                    Type = (WebApp.Models.StoreType) media.Type;

                    var container = media.Container;
                    if (container == null)
                    {
                        m_container = string.Empty;
                        Location = media.Location ?? string.Empty;
                    }
                    else
                    {
                        m_container = container.Name ?? string.Empty;
                        Location = container.UnitIdentifier ?? string.Empty;

                        if (string.IsNullOrEmpty( Location ))
                            Location = media.Location ?? string.Empty;
                    }
                }

                m_hash = (((m_container.GetHashCode() * 911) ^ Location.GetHashCode()) * 911) ^ Type.GetHashCode();
            }

            /// <summary>
            /// Gesetzt, wenn keine physikalische Ablage definiert ist.
            /// </summary>
            public bool IsGeneric { get { return string.IsNullOrEmpty( m_container ) && string.IsNullOrEmpty( Location ); } }

            /// <summary>
            /// Vergleicht diesen Schlüssel mit einem anderen.
            /// </summary>
            /// <param name="other">Ein anderer Schlüssel.</param>
            /// <returns>Gesetzt, wenn die Schlüssel äquivalent sind.</returns>
            public bool Equals( StoreKey other )
            {
                return
                    (Type == other.Type) &&
                    string.Equals( Location, other.Location ) &&
                    string.Equals( m_container, other.m_container );
            }

            /// <summary>
            /// Meldet einen Kurzschlüssel.
            /// </summary>
            /// <returns>Der gewünschte Kurzschlüssel.</returns>
            public override int GetHashCode()
            {
                return m_hash;
            }

            /// <summary>
            /// Vergleicht diesen Schlüssel mit einem beliebigen Objekt.
            /// </summary>
            /// <param name="obj">Irgendein Objekt.</param>
            /// <returns>Gesetzt, wenn das Objket ein äquivalenter Schlüssel ist.</returns>
            public override bool Equals( object obj )
            {
                var other = obj as StoreKey?;
                return other.HasValue && Equals( other.Value );
            }

            /// <summary>
            /// Ermittelt die zugehöroge Aufbewahrung.
            /// </summary>
            /// <param name="containerMap">Alle bekannten Aufbewahrungen.</param>
            /// <returns>Die zugehörige Aufbewahrung.</returns>
            public WebApp.Models.Container GetContainer( Dictionary<string, WebApp.Models.Container> containerMap )
            {
                if (string.IsNullOrEmpty( m_container ))
                    return null;
                else
                    return containerMap[m_container];
            }
        }

        /// <summary>
        /// XML <i>namespace</i> für die serialisierte Form der Datenbank.
        /// </summary>
        public const string DatabaseNamespace = "http://jochen-manns.de/VCR.NET/MediaDatabase";

        /// <summary>
        /// Alle Aufzeichnungen in der Datenbank.
        /// </summary>
        public readonly List<Recording> Recordings = new List<Recording>();

        /// <summary>
        /// Alle Serieninformationen in der Datenbank.
        /// </summary>
        public readonly List<Series> Series = new List<Series>();

        /// <summary>
        /// Alle bekannten Aufbewahrungseinheiten.
        /// </summary>
        public readonly List<Container> Containers = new List<Container>();

        /// <summary>
        /// Ermittelt alle aktuell verwendeten Genres.
        /// </summary>
        public IEnumerable<string> Genres
        {
            get
            {
                // Create
                var genres = new HashSet<string>();

                // Fill
                foreach (var recording in Recordings)
                    foreach (var genre in recording.Genres)
                        if (!string.IsNullOrEmpty( genre ))
                            genres.Add( genre );

                // Report
                return genres;
            }
        }

        /// <summary>
        /// Ermittelt alle aktuell verwendeten Sprachen.
        /// </summary>
        public IEnumerable<string> Languages
        {
            get
            {
                // Create
                var languages = new HashSet<string>();

                // Fill
                foreach (var recording in Recordings)
                    foreach (var language in recording.Languages)
                        if (!string.IsNullOrEmpty( language ))
                            languages.Add( language );

                // Report
                return languages;
            }
        }

        /// <summary>
        /// Initialisiert die Datenbank.
        /// </summary>
        /// <param name="database">Die Zieldatenbank für die neue Version.</param>
        public void CopyTo( WebApp.DAL.Database database )
        {
            database.Configuration.AutoDetectChangesEnabled = false;

            // Just improve lookup speed a bit - hey, EF is not so fast...
            var containerMap = new Dictionary<string, WebApp.Models.Container>();
            var languageMap = new Dictionary<string, WebApp.Models.Language>();
            var seriesMap = new Dictionary<string, WebApp.Models.Series>();
            var mediaMap = new Dictionary<StoreKey, WebApp.Models.Store>();
            var genreMap = new Dictionary<string, WebApp.Models.Genre>();
            var infoMap = Series.ToDictionary( series => series.Name );

            // Create all containers - DO NOT ADD TO DATABASE NOW since we build the hierarchy using the navigation property ParentContainer and not the column ParentName
            foreach (var container in Containers)
                containerMap.Add( container.Name,
                    new WebApp.Models.Container
                    {
                        Type = (WebApp.Models.ContainerType) container.Type,
                        Description = container.Location,
                        Name = container.Name,
                    } );

            // Build container hierarchy
            foreach (var container in Containers.Where( c => c.Parent != null ))
            {
                var dbContainer = containerMap[container.Name];
                var parent = container.Parent;

                dbContainer.ParentContainer = containerMap[parent.Name];
                dbContainer.Location = parent.UnitIdentifier;
            }

            // And add to database
            database.Containers.AddRange( containerMap.Values );

            // Find all media
            var dbStores = database.Stores;
            foreach (var media in Recordings.Select( r => r.Location ).Where( l => l != null ))
            {
                var mediaKey = new StoreKey( media );
                if (mediaKey.IsGeneric)
                    continue;

                WebApp.Models.Store existing;
                if (!mediaMap.TryGetValue( mediaKey, out existing ))
                    mediaMap.Add( mediaKey,
                        dbStores.Add(
                            new WebApp.Models.Store
                            {
                                Container = mediaKey.GetContainer( containerMap ),
                                Location = mediaKey.Location,
                                Type = mediaKey.Type,
                            } ) );
            }

            // Add all languages
            var dbLanguages = database.Languages;
            foreach (var language in new HashSet<string>( Languages.Select( l => l.ToLower() ) ))
                languageMap.Add( language, dbLanguages.Add( new WebApp.Models.Language { Description = language } ) );

            // Add all genres
            var dbGenres = database.Genres;
            foreach (var genre in new HashSet<string>( Genres ))
                genreMap.Add( genre, dbGenres.Add( new WebApp.Models.Genre { Description = genre } ) );

            // Add all recordings
            var dbRecordings = database.Recordings;
            foreach (var recording in Recordings)
            {
                if (recording.Links != null)
                    if (recording.Links.Length > 0)
                        throw new NotSupportedException( "Verweise werden bei der Migration nicht unterstützt" );

                var series = GetSeries( recording.Series, seriesMap, database );
                if (series != null)
                    if (series.Description == null)
                    {
                        Series seriesInfo;
                        if (infoMap.TryGetValue( series.FullName, out seriesInfo ))
                        {
                            if (seriesInfo.Links != null)
                                if (seriesInfo.Links.Length > 0)
                                    throw new NotSupportedException( "Verweise werden bei der Migration nicht unterstützt" );

                            series.Description = seriesInfo.Description ?? string.Empty;
                        }
                    }

                var mediaType = (recording.Location == null) ? WebApp.Models.StoreType.Undefined : (WebApp.Models.StoreType) recording.Location.Type;
                var mediaKey = new StoreKey( recording.Location );

                var store =
                    mediaKey.IsGeneric
                    ? dbStores.Add( new WebApp.Models.Store { Type = mediaType } )
                    : mediaMap[mediaKey];

                dbRecordings.Add(
                    new WebApp.Models.Recording
                    {
                        Genres = recording.Genres.Where( genre => !string.IsNullOrEmpty( genre ) ).Select( genre => genreMap[genre] ).ToList(),
                        Languages = recording.Languages.Select( language => languageMap[language.ToLower()] ).ToList(),
                        RentTo = string.IsNullOrEmpty( recording.Rent ) ? null : recording.Rent,
                        Identifier = recording.UniqueId,
                        CreationTime = recording.Added,
                        Title = recording.Title,
                        Series = series,
                        Store = store,
                    } );
            }
        }

        /// <summary>
        /// Ermittelt eine Serie.
        /// </summary>
        /// <param name="legacySeries">Die Referenz auf die Serie.</param>
        /// <param name="seriesMap">Alle bereits bekannten Serien.</param>
        /// <param name="database">Die Datenbank, in der die Serien verwaltet werden.</param>
        /// <returns>Die gewünschte Serie.</returns>
        private static WebApp.Models.Series GetSeries( SeriesReference legacySeries, Dictionary<string, WebApp.Models.Series> seriesMap, WebApp.DAL.Database database )
        {
            // None at all
            if (legacySeries == null)
                return null;

            // Check out for parent
            var legacyParent = legacySeries.Parent;
            var parent = (legacyParent == null) ? null : GetSeries( legacyParent, seriesMap, database );

            // Create in-memory instance for reference checks
            var series = new WebApp.Models.Series { Name = legacySeries.Name, ParentSeries = parent };
            var fullName = series.FullName;

            // See if we already know it
            WebApp.Models.Series existing;
            if (seriesMap.TryGetValue( fullName, out existing ))
                return existing;

            // Create new
            seriesMap.Add( fullName, series = database.Series.Add( series ) );

            // Report
            return series;
        }
    }
}