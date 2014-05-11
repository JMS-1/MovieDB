using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    [DataContract]
    public class Recording
    {
        [Required, Key]
        [DataMember( Name = "id" )]
        public Guid Id { get; set; }

        [Required, StringLength( 200, MinimumLength = 1 )]
        [DataMember( Name = "title" )]
        public string Title { get; set; }

        [DataMember( Name = "languages" )]
        public virtual ICollection<Language> Languages { get; set; }
    }
}