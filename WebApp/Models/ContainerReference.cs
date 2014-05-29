using System;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Beschreibt eine Position in einem Aufbewahrungsort.
    /// </summary>
    [DataContract]
    public class ContainerReference
    {
        /// <summary>
        /// Die eindeutige Kennung dieser Position.
        /// </summary>
        [Required, Key]
        public Guid RowIdentifier { get; set; }

        /// <summary>
        /// Die zugehörige Aufbewahrung.
        /// </summary>
        [Required]
        [DataMember( Name = "container" )]
        public Container Container { get; set; }

        /// <summary>
        /// Die genaue Stelle der Aufzeichnung in der Aufbewahrung - bei einer großen DVD Box könnte das
        /// etwa die laufende Nummer des Einschubs sein.
        /// </summary>
        [StringLength( 20 ), MinLength( 1 ), MaxLength( 20 )]
        [DataMember( Name = "index" )]
        public string Position { get; set; }

        /// <summary>
        /// Erstellt eine neue Position.
        /// </summary>
        public ContainerReference()
        {
            RowIdentifier = Guid.NewGuid();
        }
    }
}