using System;
using System.Xml.Serialization;


namespace MovieDB
{
    [
        Serializable,
        XmlType( "Link" )
    ]
    public class Link
    {
        public string Url { get; set; }

        public string Text { get; set; }

        public string Description { get; set; }

        public Link()
        {
        }
    }
}