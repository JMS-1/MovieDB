using System;
using System.Collections.Generic;
using System.Xml.Serialization;


namespace MovieDB
{
    /// <summary>
    /// Instanzen dieser Klassen werden als Referenzen zu Serien verwendet, denen
    /// Aufzeichnungen zugeordnet werden können.
    /// </summary>
    [
        Serializable,
        XmlType( "Series" )
    ]
    public class SeriesReference
    {
        /// <summary>
        /// Das Format zur Verknüpfung zweier Ebenen von Serien.
        /// </summary>
        public const string SeriesLevelJoinFormat = "{0} > {1}";

        /// <summary>
        /// Das Trennzeichen zwischen Ebenen von Serien - als <see cref="string"/>.
        /// </summary>
        public const string SeriesLevelJoinCharacterAsString = ">";

        /// <summary>
        /// Das Trennzeichen zwischen Ebenen von Serien - als <see cref="char"/>.
        /// </summary>
        public const char SeriesLevelJoinCharacter = '>';

        /// <summary>
        /// Liest oder setzt den Kurznamen der Serie - ohne die Namen der übergeordneten Serien.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Liest oder setzt die Referenz auf die übergeordnete Serie.
        /// </summary>
        public SeriesReference Parent { get; set; }

        /// <summary>
        /// Ermittelt die Namen dieser und aller übergeordneten Serien. Jeder Eintrag ist ein voller Serienname,
        /// wobei das erste Element der volle Name dieser Serie ist und das letzt der (volle) Name der obersten
        /// Serie.
        /// </summary>
        [XmlIgnore]
        public string[] AllNames
        {
            get
            {
                // Result
                List<string> allNames = new List<string>();

                // Fill
                for (SeriesReference current = this; null != current; current = current.Parent) allNames.Add( current.Name );

                // Create full names
                for (int i = allNames.Count - 1; i-- > 0; ) allNames[i] = string.Format( SeriesLevelJoinFormat, allNames[i + 1], allNames[i] );

                // Report
                return allNames.ToArray();
            }
        }

        /// <summary>
        /// Ermittelt den vollen Namen dieser Serie - einschließlich der Namen aller übergeordneten Serien.
        /// </summary>
        [XmlIgnore]
        public string FullName
        {
            get
            {
                // Get the name of the parent
                string parent = (null == Parent) ? null : Parent.FullName;

                // Merge
                if (!string.IsNullOrEmpty( parent )) return string.Format( SeriesLevelJoinFormat, parent, Name );

                // It's only us
                return Name;
            }
        }

        /// <summary>
        /// Erzeugt zu dem vollen Namen einer Serie eine Referenzinstanz.
        /// </summary>
        /// <param name="fullName">Der gewünschte volle Name der Serie.</param>
        /// <returns>Die zugehörige Referenz.</returns>
        public static SeriesReference CreateSeries( string fullName )
        {
            // Start with
            SeriesReference current = null;

            // None
            if (!string.IsNullOrEmpty( fullName ))
                foreach (string name in fullName.Split( SeriesReference.SeriesLevelJoinCharacter ))
                {
                    // Reduce
                    string seriesName = name.Trim();
                    if (string.IsNullOrEmpty( seriesName )) continue;

                    // Create new
                    SeriesReference series = new SeriesReference();
                    series.Parent = current;
                    series.Name = seriesName;

                    // Use
                    current = series;
                }

            // Report
            return current;
        }

        /// <summary>
        /// Prüft, ob der volle Name der Serie mit einer bestimmten Zeichenkette beginnt.
        /// </summary>
        /// <param name="prefix">Zeichenkette am Anfang des Namens.</param>
        /// <returns>Gesetzt, wenn der volle Name mit der Zeichenkette beginnt.</returns>
        public bool StartsWith( string prefix )
        {
            // All
            if (string.IsNullOrEmpty( prefix )) return true;

            // Get the name
            string name = FullName;
            if (string.IsNullOrEmpty( name )) return false;

            // Convert
            name = name.ToLower();

            // Full match
            if (name.Equals( prefix )) return true;

            // Test
            return name.ToLower().StartsWith( string.Format( SeriesLevelJoinFormat, prefix, string.Empty ) );
        }

        /// <summary>
        /// Erzeugt eine neue Referenz auf eine Serie.
        /// </summary>
        public SeriesReference()
        {
        }
    }

    /// <summary>
    /// Beschreibt zusätzliche Informationen zu einer Serie.
    /// </summary>
    [
        Serializable,
        XmlType( "SeriesInfo" )
    ]
    public class Series
    {
        /// <summary>
        /// Liest oder setzt den vollen Namen der Serie.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Liest oder setzt die Beschreibung der Serie.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Liest oder setzt die externen Informationen zur Serie.
        /// </summary>
        public Link[] Links { get; set; }

        /// <summary>
        /// Erzeugt eine Informationsinstanz für eine Serie.
        /// </summary>
        public Series()
        {
        }
    }

}