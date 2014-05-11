using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    [DataContract]
    public class Language
    {
        [Required, Key, StringLength( 2, MinimumLength = 2 )]
        [DataMember( Name = "id" )]
        public string Short { get; set; }

        [Required, Index( IsUnique = true ), StringLength( 20, MinimumLength = 2 )]
        [DataMember( Name = "description" )]
        public string Long { get; set; }

        public virtual ICollection<Recording> Recordings { get; set; }
    }
}