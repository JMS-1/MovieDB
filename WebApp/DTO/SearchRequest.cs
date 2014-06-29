using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;


namespace WebApp.DTO
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
        [EnumMember( Value = "titleWithSeries" )]
        HierarchicalName,

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
        /// Eine Liste von Arten, die alle berücksichtigt werden sollen.
        /// </summary>
        [DataMember( Name = "genres" )]
        public readonly List<Guid> RequiredGenres = new List<Guid>();

        /// <summary>
        /// Die Sprache, die eine Aufzeichnung haben muss.
        /// </summary>
        [DataMember( Name = "language" )]
        public Guid? RequiredLanguage { get; set; }

        /// <summary>
        /// Die zu betrachtende Serie.
        /// </summary>
        [DataMember( Name = "series" )]
        public readonly List<Guid> RequiredSeries = new List<Guid>();

        /// <summary>
        /// Gesetzt, wenn ausgeliehene Aufzeichnungen gesucht werden sollen.
        /// </summary>
        [DataMember( Name = "rent" )]
        public bool? IsRent { get; set; }

        /// <summary>
        /// Ein Text, nach dem gesucht werden soll.
        /// </summary>
        [DataMember( Name = "text" )]
        public string Text { get; set; }

        /// <summary>
        /// Setzt eine Suche mit Standardparametern auf.
        /// </summary>
        public SearchRequest()
        {
            OrderBy = SearchRequestOrderBy.HierarchicalName;
            SortAscending = true;
            PageIndex = 0;
            PageSize = 15;
        }

        /// <summary>
        /// Prüft, ob die Suche gültig ist.
        /// </summary>
        public void Validate()
        {
            // Validate parameters
            if (PageSize < 1)
                throw new InvalidOperationException( "Die Anzahl der Ergebnisse einer Suche muss zwischen 1 und 250 liegen (jeweils einschließlich)." );
            if (PageSize > 250)
                throw new InvalidOperationException( "Die Anzahl der Ergebnisse einer Suche muss zwischen 1 und 250 liegen (jeweils einschließlich)." );
            if (PageIndex < 0)
                throw new InvalidOperationException( "Die Nummer der Ergebnisseite darf nicht negativ sein." );
            if (!Enum.IsDefined( typeof( SearchRequestOrderBy ), OrderBy ))
                throw new InvalidOperationException( "Nach der Eigenschaft kann nicht sortiert werden." );

            // Full check against limit
            if ((RawOffset + PageSize) > int.MaxValue)
                throw new InvalidOperationException( "Die Nummer der Ergebnisseite darf nicht negativ sein." );
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
        /// <param name="database">Die zu verwendende Datenbank.</param>
        /// <param name="request">Die gewümschten Einschränkungen.</param>
        /// <param name="response">Das Ergebnis der Suche.</param>
        /// <returns>Die vorbereitete Suche.</returns>
        public static IQueryable<Models.Recording> Apply( this DAL.Database database, SearchRequest request, SearchInformation response )
        {
            var recordings = (IQueryable<Models.Recording>) database.Recordings;

            // Apply genre filter
            foreach (var genre in request.RequiredGenres)
            {
                var capturedGenre = genre;

                // Require ALL genres to be available simultanously
                recordings = recordings.Where( r => r.Genres.Any( g => g.UniqueIdentifier == capturedGenre ) );
            }

            // Apply series
            if (request.RequiredSeries.Count > 0)
                recordings = recordings.Where( r => request.RequiredSeries.Contains( r.SeriesIdentifier.Value ) );

            // Apply rent option
            if (request.IsRent.HasValue)
                if (request.IsRent.Value)
                    recordings = recordings.Where( r => r.RentTo != null );
                else
                    recordings = recordings.Where( r => r.RentTo == null );

            // Free text
            if (!string.IsNullOrEmpty( request.Text ))
                recordings = recordings.Where( r => r.FullName.Contains( request.Text ) );

            // Language statistics is made just prior to setting the language because currently only one language may be choosen
            response.LanguageStatistics =
                recordings
                    .SelectMany( r => r.Languages )
                    .GroupBy( l => l.UniqueIdentifier )
                    .Select( g => new SearchInformation.Language { Identifier = g.Key, Count = g.Count() } )
                    .ToArray();

            // Apply language filter
            if ( request.RequiredLanguage .HasValue)
                recordings = recordings.Where( r => r.Languages.Any( l => l.UniqueIdentifier == request.RequiredLanguage.Value ) );

            // Check counter after filter is applied but bevore we start restricting
            response.TotalCount = recordings.Count();

            // Genre statistics will be made on full restriction to support multi value
            response.GenreStatistics =
                recordings
                    .SelectMany( r => r.Genres )
                    .GroupBy( g => g.UniqueIdentifier )
                    .Select( g => new SearchInformation.Genre { Identifier = g.Key, Count = g.Count() } )
                    .ToArray();

            // Apply order
            switch (request.OrderBy)
            {
                case SearchRequestOrderBy.HierarchicalName:
                    if (request.SortAscending)
                        recordings = recordings.OrderBy( recording => recording.FullName );
                    else
                        recordings = recordings.OrderByDescending( recording => recording.FullName );
                    break;

                case SearchRequestOrderBy.Created:
                    if (request.SortAscending)
                        recordings = recordings.OrderBy( recording => recording.CreationTimeInDatabase );
                    else
                        recordings = recordings.OrderByDescending( recording => recording.CreationTimeInDatabase );
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