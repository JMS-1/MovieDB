using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Ein einzelner Aufbewahrungsort.
    /// </summary>
    [DataContract]
    public class Container
    {
        /// <summary>
        /// Die Art der Aufbewahrung.
        /// </summary>
        [Required]
        [DataMember( Name = "type" )]
        public ContainerType Type { get; set; }

        /// <summary>
        /// Der eindeutige Name der Aufbewahrung.
        /// </summary>
        [Required, Key, StringLength( 50 ), MaxLength( 50 ), MinLength( 1 )]
        [DataMember( Name = "name" )]
        public string Name { get; set; }

        /// <summary>
        /// Die übergeordnete Aufbewahrung, sofern vorhanden.
        /// </summary>
        [DataMember( Name = "parent" )]
        public Container ParentContainer { get; set; }

        /// <summary>
        /// Die Position in der übergeordnete Aufbewahrung, sofern vorhanden.
        /// </summary>
        [DataMember( Name = "positionInParent" )]
        [StringLength( 20 ), MaxLength( 20 )]
        public string ParentPosition { get; set; }

        /// <summary>
        /// Eine Kurzbeschreibung des Standorts der Aufbewahrungseinheit.
        /// </summary>
        [StringLength( 200 ), MaxLength( 200 )]
        [DataMember( Name = "description" )]
        public string Description { get; set; }

        /// <summary>
        /// Erzeugt eine neue Beschreibung.
        /// </summary>
        public Container()
        {
            // Set up
            Type = ContainerType.Undefined;
        }
    }
}