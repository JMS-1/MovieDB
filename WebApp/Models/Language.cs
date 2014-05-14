using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Die Sprache einer Tonspur.
    /// </summary>
    [DataContract]
    public class Language
    {
        /// <summary>
        /// Der Kurzname der Sprache. 
        /// </summary>
        [Required, Key, StringLength( 2, MinimumLength = 2 )]
        [DataMember( Name = "id" )]
        public string Short { get; set; }

        /// <summary>
        /// Der Langname der Sprache.
        /// </summary>
        [Required, Index( IsUnique = true ), StringLength( 20, MinimumLength = 1 )]
        [DataMember( Name = "description" )]
        public string Long { get; set; }

        /// <summary>
        /// Wird zum korrekten Aufbau des Modells benötigt.
        /// </summary>
        public virtual ICollection<Recording> Recordings { get; set; }
    }
}