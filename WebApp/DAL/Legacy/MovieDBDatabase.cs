using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
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
        /// Erzeugt einen Ausschnitt aller Aufzeichnungen zur Anzeige in einem Web Formular.
        /// </summary>
        /// <param name="filter">Einschränkende Bedingungen zur Ermitteltung der Teilmenge.</param>
        /// <returns>Eine Sicht auf eine Tabelle mit den gewünschten Informationen.</returns>
        public DataView CreateTable( RecordingFilter filter )
        {
            // Create new
            DataTable table = new DataTable();

            // Create columns
            DataColumn guid = table.Columns.Add( "id", typeof( Guid ) );
            DataColumn title = table.Columns.Add( "Title", typeof( string ) );
            DataColumn created = table.Columns.Add( "Added", typeof( DateTime ) );
            DataColumn genres = table.Columns.Add( "Genres", typeof( string ) );
            DataColumn languages = table.Columns.Add( "Languages", typeof( string ) );
            DataColumn rent = table.Columns.Add( "Rent", typeof( string ) );

            // Create genre filter map
            Dictionary<string, bool> genreMap = new Dictionary<string, bool>();

            // Fill map
            foreach (string genre in filter.Genres) genreMap[genre] = true;

            // Load fulltext filter
            string fulltext = string.IsNullOrEmpty( filter.Volltext ) ? null : filter.Volltext.ToLower();

            // Load the series matcher
            string series = string.IsNullOrEmpty( filter.Series ) ? null : filter.Series.ToLower();

            // Fill
            lock (this)
                foreach (Recording recording in Recordings)
                {
                    // Check for genre
                    if (genreMap.Count > 0)
                    {
                        // Got it
                        int genreCount = 0;

                        // Find
                        foreach (string genre in recording.Genres)
                            if (!string.IsNullOrEmpty( genre ))
                                if (genreMap.ContainsKey( genre ))
                                    ++genreCount;

                        // Not found
                        if (genreCount != genreMap.Count)
                            continue;
                    }

                    // Check for fulltext
                    if (!string.IsNullOrEmpty( fulltext ))
                        if (string.IsNullOrEmpty( recording.Title ) || (recording.Title.ToLower().IndexOf( fulltext ) < 0))
                        {
                            // No series - no last chance
                            if (null == recording.Series) continue;

                            // Get series name
                            string seriesName = recording.Series.FullName;
                            if (string.IsNullOrEmpty( seriesName ) || (seriesName.ToLower().IndexOf( fulltext ) < 0)) continue;
                        }

                    // Check for series
                    if (!string.IsNullOrEmpty( series ))
                        if ((null == recording.Series) || !recording.Series.StartsWith( series ))
                            continue;

                    // Check for language
                    if (!string.IsNullOrEmpty( filter.Language ))
                    {
                        // Not found
                        bool found = false;

                        // Test all
                        foreach (string lang in recording.Languages)
                            if (found = filter.Language.Equals( lang ))
                                break;

                        // Done
                        if (!found)
                            continue;
                    }

                    // Check for availability
                    if (filter.IsRent)
                        if (string.IsNullOrEmpty( recording.Rent ))
                            continue;

                    // Add it
                    table.Rows.Add
                        (
                            recording.UniqueId,
                            recording.FullTitle,
                            recording.Added.ToLocalTime(),
                            string.Join( "; ", recording.Genres.ToArray() ),
                            string.Join( "; ", recording.Languages.ToArray() ),
                            string.IsNullOrEmpty( recording.Rent ) ? null : string.Format( Resources.MovieDBStrings.Format_Rent, recording.Rent )
                        );
                }

            // Create the view
            DataView view = table.DefaultView;

            // Create the sort
            switch (filter.SortMode)
            {
                case RecordingFilter.SortModes.SortTitleAscending: view.Sort = "Title ASC"; break;
                case RecordingFilter.SortModes.SortTitleDescending: view.Sort = "Title DESC"; break;
                case RecordingFilter.SortModes.SortDateAscending: view.Sort = "Added ASC"; break;
                case RecordingFilter.SortModes.SortDateDescinding: view.Sort = "Added DESC"; break;
            }

            // Report 
            return view;
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
    }
}