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
    [Table( "Languages" )]
    public class Language
    {
        /// <summary>
        /// Der Kurzname der Sprache. 
        /// </summary>
        [Required, Key, StringLength( 2, MinimumLength = 2 )]
        [Column( "Short" )]
        [DataMember( Name = "id" )]
        public string ShortName { get; set; }

        /// <summary>
        /// Der Langname der Sprache.
        /// </summary>
        [Required, StringLength( 100, MinimumLength = 1 )]
        [Column( "Long" )]
        [DataMember( Name = "description" )]
        public string LongName { get; set; }
    }
}