using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;


namespace WebApp.Models
{
    [DataContract]
    public class Recording
    {
        [Required, Key, DataMember]
        public Guid Id { get; set; }

        [Required, StringLength( 200, MinimumLength = 1 ), DataMember]
        public string Title { get; set; }

        [DataMember]
        public virtual ICollection<Language> Languages { get; set; }
    }
}