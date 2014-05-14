using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Eine Aufnahme.
    /// </summary>
    [DataContract]
    public class Recording
    {
        /// <summary>
        /// Die eindeutige Kennung der Aufnahme, über die diese permanent referenziert werden kann.
        /// </summary>
        [Required, Key]
        [DataMember( Name = "id" )]
        public Guid Id { get; set; }

        /// <summary>
        /// Der Name der aufgezeichneten Sendung.
        /// </summary>
        [Required, StringLength( 200, MinimumLength = 1 )]
        [DataMember( Name = "title" )]
        public string Title { get; set; }

        /// <summary>
        /// Die Liste der Sprachen zur Aufzeichnung.
        /// </summary>
        [DataMember( Name = "languages" )]
        public virtual ICollection<Language> Languages { get; set; }

        /// <summary>
        /// Die Art(en) der Aufnahme.
        /// </summary>
        [DataMember( Name = "genres" )]
        public virtual ICollection<Genre> Genres { get; set; }
    }
}