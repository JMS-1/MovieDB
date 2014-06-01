using System;
using System.Linq;
using System.Runtime.Serialization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;


namespace WebApp.Models
{
    /// <summary>
    /// Beschreibt die Sortierung der Ergebnistabelle.
    /// </summary>
    [DataContract]
    public enum SearchRequestOrderBy
    {
        /// <summary>
        /// Die Sortierung erfolgt nach dem Namen.
        /// </summary>
        [EnumMember( Value = "title" )]
        Title,

        /// <summary>
        /// Die Sortierung erfolgt nach dem Datum.
        /// </summary>
        [EnumMember( Value = "date" )]
        Created,
    }

    /// <summary>
    /// Die Eckdaten einer Suchanfrage.
    /// </summary>
    [DataContract]
    public class SearchRequest
    {
        /// <summary>
        /// Die 0-basierte Nummer der Seite in der Liste aller Ergebnisse.
        /// </summary>
        [DataMember( Name = "page" )]
        public int PageIndex { get; set; }

        /// <summary>
        /// Die Anzahl der Ergebnisse pro Seite.
        /// </summary>
        [DataMember( Name = "size" )]
        public int PageSize { get; set; }

        /// <summary>
        /// Die Eigenschaft, nach der die Ergebnisse sortiert werden sollen.
        /// </summary>
        [DataMember( Name = "order" )]
        [JsonConverter( typeof( StringEnumConverter ) )]
        public SearchRequestOrderBy OrderBy { get; set; }

        /// <summary>
        /// Gesetzt, wenn aufsteigend sortiert werden soll.
        /// </summary>
        [DataMember( Name = "ascending" )]
        public bool SortAscending { get; set; }

        /// <summary>
        /// Die 0-basierte laufenden Nummer der ersten Ergebniszeile.
        /// </summary>
        private long RawOffset { get { return (long) PageIndex * (long) PageSize; } }

        /// <summary>
        /// Die 0-basierte laufenden Nummer der ersten Ergebniszeile.
        /// </summary>
        public long Offset { get { return checked( (int) RawOffset ); } }

        /// <summary>
        /// Setzt eine Suche mit Standardparametern auf.
        /// </summary>
        public SearchRequest()
        {
            PageIndex = 0;
            PageSize = 10;
        }

        /// <summary>
        /// Prüft, ob die Suche gültig ist.
        /// </summary>
        public void Validate()
        {
            // Validate parameters
            if (PageSize < 1)
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadPageSize );
            if (PageSize > 250)
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadPageSize );
            if (PageIndex < 0)
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadPageIndex );
            if (!Enum.IsDefined( typeof( SearchRequestOrderBy ), OrderBy ))
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadProperty );

            // Full check against limit
            if ((RawOffset + PageSize) > int.MaxValue)
                throw new InvalidOperationException( Resources.MovieDBStrings.Exception_BadPageIndex );
        }
    }

    /// <summary>
    /// Einige Hilfsklassen zur Ausführung von Suchen.
    /// </summary>
    public static class SearchRequestExtensions
    {
        /// <summary>
        /// Wendet die Suchbeschreibung auf eine Suche an.
        /// </summary>
        /// <param name="recordings">Eine Suche nach Aufzeichnungen.</param>
        /// <param name="request">Die gewümschten Einschränkungen.</param>
        /// <returns>Die vorbereitete Suche.</returns>
        public static IQueryable<Recording> Apply( this IQueryable<Recording> recordings, SearchRequest request, out int totalCount )
        {
            // Check counter after filter is applied but bevore we start restricting
            totalCount = recordings.Count();

            // Apply order
            switch (request.OrderBy)
            {
                case SearchRequestOrderBy.Title:
                    if (request.SortAscending)
                        recordings = recordings.OrderBy( recording => recording.Title );
                    else
                        recordings = recordings.OrderByDescending( recording => recording.Title );
                    break;
            }

            // Apply start offset
            var offset = request.Offset;
            if (offset > 0)
                recordings = recordings.Skip( (int) offset );

            // Always restrict number of results
            return recordings.Take( request.PageSize );
        }
    }
}