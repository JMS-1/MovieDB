﻿using System;
using System.Linq;
using System.Runtime.Serialization;


namespace WebApp.DTO
{
    /// <summary>
    /// Beschreibt eine Aufzeichnung für die Ansicht in einer Tabelle.
    /// </summary>
    [DataContract]
    public abstract class Recording
    {
        /// <summary>
        /// Der Name der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "title" )]
        public string Name { get; set; }

        /// <summary>
        /// Der Ausleiher der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "rent" )]
        public string RentTo { get; set; }

        /// <summary>
        /// Die Sprachen aller Tonspuren.
        /// </summary>
        [DataMember( Name = "languages" )]
        public Guid[] Languages { get; set; }

        /// <summary>
        /// Die Arten der Aufzeichnung.
        /// </summary>
        [DataMember( Name = "genres" )]
        public Guid[] Genres { get; set; }
        /// <summary>
        /// Die eindeutige Kennung der Serie.
        /// </summary>
        [DataMember( Name = "series" )]
        public Guid? Series { get; set; }

        /// <summary>
        /// Initialiisert eine Aufzeichung.
        /// </summary>
        /// <param name="recording">Die Daten aus der Datenbank.</param>
        protected Recording( Models.Recording recording )
        {
            Languages = recording.Languages.OrderBy( l => l.Name ).Select( l => l.UniqueIdentifier ).ToArray();
            Genres = recording.Genres.OrderBy( g => g.Name ).Select( g => g.UniqueIdentifier ).ToArray();
            Series = recording.SeriesIdentifier;
            RentTo = recording.RentTo;
            Name = recording.Name;
        }

        /// <summary>
        /// Initialisiert eine Aufzeichnung.
        /// </summary>
        protected Recording()
        {
        }
    }
}