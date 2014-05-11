using System.Runtime.Serialization;


namespace WebApp.Models
{
    [DataContract]
    public class ApplicationInformation
    {
        [DataMember( Name = "empty" )]
        public bool DatabaseIsEmpty { get; set; }
    }
}