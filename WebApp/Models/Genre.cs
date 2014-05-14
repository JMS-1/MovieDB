using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Eine Art von Aufnahme.
    /// </summary>
    [DataContract]
    public class Genre
    {
        /// <summary>
        /// Der Name der Art.
        /// </summary>
        [Required, Key, StringLength( 20, MinimumLength = 1 )]
        [DataMember( Name = "id" )]
        public string Name { get; set; }

        /// <summary>
        /// Wird zum korrekten Aufbau des Modells benötigt.
        /// </summary>
        public virtual ICollection<Recording> Recordings { get; set; }
    }
}