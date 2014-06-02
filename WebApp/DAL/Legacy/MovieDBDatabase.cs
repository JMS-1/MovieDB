using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Xml;
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
        /// Synchronisiert den Zugriff auf <see cref="m_Current"/>.
        /// </summary>		
        private static object m_LoaderLock = new object();

        /// <summary>
        /// Einzige Instanz der Datenbank pro <see cref="AppDomain"/>, durch die ein <i>Singleton</i>
        /// Verhalten nachgebildet wird.
        /// </summary>
        private static Database m_Current = null;

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
        /// Die Liste aller aktuell zugeordneten Genres.
        /// </summary>
        private List<string> m_Genres = null;

        /// <summary>
        /// Eine Liste aller aktuell verwendeten Sprachen.
        /// </summary>
        private List<string> m_Languages = null;

        /// <summary>
        /// Eine Liste aller aktuell verwendeten Serien - gebildet aus den Serienreferenzen
        /// aller Aufzeichnungen.
        /// </summary>
        private List<string> m_SeriesNames = null;

        /// <summary>
        /// Zusätzliche Verwaltung der Aufzeichnungen auf Basis einer internen Kennung, die 
        /// bei jedem Start der Anwendung neu vergeben werden.
        /// </summary>
        [XmlIgnore]
        private Dictionary<Guid, Recording> m_RecordingMap;

        /// <summary>
        /// Zusätzliche Verwaltung aller Serien.
        /// </summary>
        [XmlIgnore]
        private Dictionary<string, Series> m_SeriesMap;

        /// <summary>
        /// Erzeugt eine neue Datenbank.
        /// </summary>
        public Database()
        {
            // Create map
            m_RecordingMap = new Dictionary<Guid, Recording>();
            m_SeriesMap = new Dictionary<string, Series>();
        }

        /// <summary>
        /// Ermittelt den absoluten Pfad zur serialisierten Fassung der Datenbank zur <see cref="AppDomain"/>.
        /// </summary>
        private static FileInfo DatabasePath
        {
            get
            {
                // Construct
                return new FileInfo( Path.Combine( HttpContext.Current.Request.PhysicalApplicationPath, @"App_Data\MediaDatabase.xml" ) );
            }
        }

        /// <summary>
        /// Ermittelt alle aktuell verwendeten Genres.
        /// </summary>
        public string[] Genres
        {
            get
            {
                // Synchronize
                lock (this)
                {
                    // Must load
                    if (null == m_Genres)
                    {
                        // Create
                        Dictionary<string, bool> genres = new Dictionary<string, bool>();

                        // Fill
                        foreach (Recording recording in Recordings)
                            foreach (string genre in recording.Genres)
                                if (!string.IsNullOrEmpty( genre ))
                                    genres[genre] = true;

                        // Create list
                        m_Genres = new List<string>( genres.Keys );

                        // Sort it
                        m_Genres.Sort();
                    }

                    // Report
                    return m_Genres.ToArray();
                }
            }
        }

        /// <summary>
        /// Ermittelt alle aktuell verwendeten Sprachen.
        /// </summary>
        public string[] Languages
        {
            get
            {
                // Synchronize
                lock (this)
                {
                    // Must load
                    if (null == m_Languages)
                    {
                        // Create
                        Dictionary<string, bool> languages = new Dictionary<string, bool>();

                        // Fill
                        foreach (Recording recording in Recordings)
                            foreach (string language in recording.Languages)
                                if (!string.IsNullOrEmpty( language ))
                                    languages[language] = true;

                        // Create list
                        m_Languages = new List<string>( languages.Keys );

                        // Sort it
                        m_Languages.Sort();
                    }

                    // Report
                    return m_Languages.ToArray();
                }
            }
        }

        /// <summary>
        /// Ermittelt alle aktuell referenzierten Serien - nicht zu allen muss es erweiterte Informationen
        /// geben.
        /// </summary>
        public string[] SeriesNames
        {
            get
            {
                // Synchronize
                lock (this)
                {
                    // Must load
                    if (null == m_SeriesNames)
                    {
                        // Create
                        Dictionary<string, bool> series = new Dictionary<string, bool>();

                        // Fill
                        foreach (Recording recording in Recordings)
                            if (null != recording.Series)
                                foreach (string seriesName in recording.Series.AllNames)
                                    if (!string.IsNullOrEmpty( seriesName ))
                                        series[seriesName] = true;

                        // Fill
                        foreach (Series seriesInfo in Series)
                            if (!string.IsNullOrEmpty( seriesInfo.Name ))
                                series[seriesInfo.Name] = true;

                        // Create list
                        m_SeriesNames = new List<string>( series.Keys );

                        // Sort it
                        m_SeriesNames.Sort();
                    }

                    // Report
                    return m_SeriesNames.ToArray();
                }
            }
        }

        /// <summary>
        /// Speichert diese Instanz als die aktuelle Datenbank in der XML serialisierten Form.
        /// </summary>
        public void Save()
        {
            // One at a time
            lock (this)
            {
                // Attach to the file
                FileInfo path = DatabasePath, backup = null;

                // Create a backup
                if (path.Exists)
                {
                    // Create backup file name
                    backup = new FileInfo( path.FullName + ".bak" );

                    // Create
                    File.Move( path.FullName, backup.FullName );
                }

                // Create configuration
                XmlWriterSettings settings = new XmlWriterSettings();

                // Fill configuration
                settings.Encoding = Encoding.Unicode;
                settings.Indent = true;

                // Create serializer
                XmlSerializer serializer = new XmlSerializer( GetType(), DatabaseNamespace );

                // Process
                using (Stream stream = path.OpenWrite())
                using (XmlWriter writer = XmlWriter.Create( stream, settings ))
                    serializer.Serialize( writer, this );

                // Remove backup copy
                if (null != backup) backup.Delete();
            }
        }

        /// <summary>
        /// Erzeugt die initiale Nachschlagetabelle für Aufzeichnungen.
        /// </summary>
        public void CreateMaps()
        {
            // Fill
            foreach (Recording recording in Recordings) m_RecordingMap[recording.UniqueId] = recording;
            foreach (Series series in Series) m_SeriesMap[series.Name] = series;
        }

        /// <summary>
        /// Fügt eine neue Aufzeichnung zu Datenbank hinzu oder ersetzt eine vorhandene Aufzeichnung.
        /// </summary>
        /// <remarks>
        /// Die Veränderung wird nicht automatisch mit <see cref="Save"/> gespeichert.
        /// </remarks>
        /// <param name="recording">Die neue oder veränderte Aufzeichnung.</param>
        /// <exception cref="ArgumentNullException">Es wurde keine Aufzeichnung angegeben.</exception>
        public void AddRecording( Recording recording )
        {
            // Validate
            if (null == recording) throw new ArgumentNullException( "recording" );

            // Synchronized
            lock (this)
            {
                // Check existance
                Recording previous;
                if (m_RecordingMap.TryGetValue( recording.UniqueId, out previous )) Recordings.Remove( previous );

                // Add
                Recordings.Add( recording );

                // Update map
                m_RecordingMap[recording.UniqueId] = recording;

                // Reset caches
                m_Languages = null;
                m_SeriesNames = null;
                m_Genres = null;
            }
        }

        /// <summary>
        /// Ergänzt die Informationen zu einer Serie in der Datenbank oder aktualisiert eine vorhandene
        /// Information.
        /// </summary>
        /// <remarks>
        /// Die veränderte Datenbank wird nicht automatisch mittels <see cref="Save"/> gespeichert.
        /// </remarks>
        /// <param name="series">Neue Serieninformationen.</param>
        /// <exception cref="ArgumentNullException">Es wurde keine Serie angegeben oder die Serie hat
        /// keinen Namen.</exception>
        public void AddSeries( Series series )
        {
            // Validate
            if (null == series) throw new ArgumentNullException( "series" );
            if (string.IsNullOrEmpty( series.Name )) throw new ArgumentNullException( "series.Name" );

            // Synchronized
            lock (this)
            {
                // Check existance
                Series previous;
                if (m_SeriesMap.TryGetValue( series.Name, out previous )) Series.Remove( previous );

                // Add
                Series.Add( series );

                // Update map
                m_SeriesMap[series.Name] = series;

                // Reset caches
                m_SeriesNames = null;
            }
        }

        /// <summary>
        /// Entfernt eine Aufzeichnung aus der Datenbank.
        /// </summary>
        /// <remarks>
        /// Die Veränderung wird nicht automatisch mit <see cref="Save"/> gespeichert.
        /// </remarks>
        /// <param name="recording">Die zu löschende Aufzeichnung.</param>
        /// <exception cref="ArgumentNullException">Es wurde keine Aufzeichnung angegeben. Wird eine 
        /// Aufzeichnung verwendet, die gar nicht in der Datenbank vorhanden ist, so wird kein
        /// Fehler ausgelöst.</exception>
        public void DeleteRecording( Recording recording )
        {
            // Validate
            if (null == recording) throw new ArgumentNullException( "recording" );

            // Synchronized
            lock (this)
            {
                // Check existance
                Recording previous;
                if (!m_RecordingMap.TryGetValue( recording.UniqueId, out previous )) return;

                // Remove from list
                Recordings.Remove( previous );

                // Remove from map
                m_RecordingMap.Remove( recording.UniqueId );

                // Reset caches
                m_Languages = null;
                m_SeriesNames = null;
                m_Genres = null;
            }
        }

        /// <summary>
        /// Entfernt die Informationen einer Serie aus der Datenbank.
        /// </summary>
        /// <remarks>
        /// Die veränderte Datenbank wird nicht automatisch mittels <see cref="Save"/> gespeichert.
        /// </remarks>
        /// <param name="series">Zu entfernende Serie.</param>
        /// <exception cref="ArgumentNullException">Es wurde keine Serie angegeben oder die Serie hat
        /// keinen Namen.</exception>
        public void DeleteSeries( Series series )
        {
            // Validate
            if (null == series) throw new ArgumentNullException( "series" );
            if (string.IsNullOrEmpty( series.Name )) throw new ArgumentNullException( "series.Name" );

            // Synchronized
            lock (this)
            {
                // Check existance
                Series previous;
                if (!m_SeriesMap.TryGetValue( series.Name, out previous )) return;

                // Remove from list
                Series.Remove( previous );

                // Remove from map
                m_SeriesMap.Remove( series.Name );

                // Reset caches
                m_SeriesNames = null;
            }
        }

        /// <summary>
        /// Ermittelt die aktuelle Datenbank dieser <see cref="AppDomain"/>.
        /// </summary>
        public static Database Current
        {
            get
            {
                // Load once
                lock (m_LoaderLock)
                    if (null == m_Current)
                    {
                        // Attach to the file
                        FileInfo db = DatabasePath;

                        // Check mode
                        if (!db.Exists)
                        {
                            // Create directory
                            if (!db.Directory.Exists) db.Directory.Create();

                            // Create file
                            new Database().Save();
                        }

                        // Create serializer
                        XmlSerializer serializer = new XmlSerializer( typeof( Database ), DatabaseNamespace );

                        // Load
                        using (Stream stream = db.OpenRead())
                        {
                            // Load
                            m_Current = (Database) serializer.Deserialize( stream );

                            // Create map
                            m_Current.CreateMaps();
                        }
                    }

                // Report
                return m_Current;
            }
        }

        /// <summary>
        /// Ermittelt eine Aufzeichnung. 
        /// </summary>
        /// <param name="id">Eindeutige Kennung der Aufzeichnung - ist keine derartige Aufzeichnung vorhanden,
        /// so wird ein Fehler ausgelöst.</param>
        /// <returns>Die gewünschte Aufzeichnung.</returns>
        public Recording FindRecording( Guid id )
        {
            // Report
            lock (this) return m_RecordingMap[id];
        }

        /// <summary>
        /// Ermittelt die Serieninformation zu einer Serie.
        /// </summary>
        /// <param name="series">Die Referenz auf die gewünschte Serie.</param>
        /// <returns>Die zugehörige Serieninformation oder <i>null</i>, wenn keine existiert.</returns>
        /// <exception cref="ArgumentNullException">Es wurde keine Serie angegeben.</exception>
        public Series FindSeries( SeriesReference series )
        {
            // Validate
            if (null == series) throw new ArgumentNullException( "series" );

            // Forward
            return FindSeries( series.FullName );
        }

        /// <summary>
        /// Ermittelt die Serieninformation zu einer Serie.
        /// </summary>
        /// <param name="fullname">Der volle Name der Serie.</param>
        /// <returns>Die zugehörige Serieninformation oder <i>null</i>, wenn keine existiert.</returns>
        /// <exception cref="ArgumentNullException">Es wurde kein Name angegeben.</exception>
        public Series FindSeries( string fullname )
        {
            // Validate
            if (string.IsNullOrEmpty( fullname )) throw new ArgumentNullException( "fullname" );

            // Find
            Series series;
            if (m_SeriesMap.TryGetValue( fullname, out series )) return series;

            // Not found - this is not an error
            return null;
        }

        /// <summary>
        /// Ermittelt eine Aufbewahrungsinformation.
        /// </summary>
        /// <param name="name">Der eindeutige Name der Aufbewahrung.</param>
        /// <returns>Die gewünschte Aufbewahrung oder <i>null</i>, wenn keine solche existiert.</returns>
        public Container FindContainer( string name )
        {
            // Just scan
            foreach (Container container in Containers)
                if (0 == string.Compare( name, container.Name, true ))
                    return container;

            // Not found
            return null;
        }

        /// <summary>
        /// Initialisiert die Datenbank.
        /// </summary>
        /// <param name="database">Die Zieldatenbank für die neue Version.</param>
        public void CopyTo( WebApp.DAL.Database database )
        {
            // Just improve lookup speed a bit - hey, EF is not so fast...
            var containerMap = new Dictionary<string, WebApp.Models.Container>();
            var languageMap = new Dictionary<string, WebApp.Models.Language>();
            var mediaMap = new Dictionary<StoreKey, WebApp.Models.Store>();
            var genreMap = new Dictionary<string, WebApp.Models.Genre>();

            // Add all containers
            var dbContainers = database.Containers;
            foreach (var container in Containers)
                containerMap.Add( container.Name,
                    dbContainers.Add(
                        new WebApp.Models.Container
                        {
                            Type = (WebApp.Models.ContainerType) container.Type,
                            Description = container.Location,
                            Name = container.Name,
                        } ) );

            // Build container hierarchy
            foreach (var container in Containers.Where( c => c.Parent != null ))
            {
                var dbContainer = containerMap[container.Name];
                var parent = container.Parent;

                dbContainer.ParentContainer = containerMap[parent.Name];
                dbContainer.Location = parent.UnitIdentifier;
            }

            // Find all media
            var dbStores = database.Stores;
            foreach (var media in Recordings.Take( 100 ).Select( r => r.Location ).Where( l => l != null ))
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
                languageMap.Add( language, dbLanguages.Add( new WebApp.Models.Language { TwoLetterIsoName = language, Description = language } ) );

            // Add all genres
            var dbGenres = database.Genres;
            foreach (var genre in new HashSet<string>( Genres ))
                genreMap.Add( genre, dbGenres.Add( new WebApp.Models.Genre { Name = genre, Description = genre } ) );

            // Add all recordings
            var dbRecordings = database.Recordings;
            foreach (var recording in Recordings.Take( 100 ))
            {
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
                        Identifier = recording.UniqueId,
                        CreationTime = recording.Added,
                        Title = recording.Title,
                        Store = store,
                    } );
            }
        }
    }
}