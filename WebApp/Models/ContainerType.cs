using System.Runtime.Serialization;


namespace WebApp.Models
{
    /// <summary>
    /// Die Art der Ablage.
    /// </summary>
    [DataContract]
    public enum ContainerType
    {
        /// <summary>
        /// Nicht näher spezifiziert.
        /// </summary>
        [EnumMember( Value = "undefined" )]
        Undefined,

        /// <summary>
        /// Eine Zusammenstellung von zusammen gehörigen Aufzeichnungen, wie etwa eine kleine DVD Box
        /// mit einer vollständigen Staffel einer Serie.
        /// </summary>
        [EnumMember( Value = "set" )]
        FeatureSet,

        /// <summary>
        /// Eine größere DVD Box mit einer eventuell wilden Sammlung unterschiedlicher Aufzeichnungen.
        /// </summary>
        [EnumMember( Value = "box" )]
        Box,

        /// <summary>
        /// Ein Regal oder ein Fach in einem Regal.
        /// </summary>
        [EnumMember( Value = "shelf" )]
        Shelf,
    }
}