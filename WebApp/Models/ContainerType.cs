

namespace WebApp.Models
{
    /// <summary>
    /// Die Art der Ablage.
    /// </summary>
    public enum ContainerType : byte
    {
        /// <summary>
        /// Nicht näher spezifiziert.
        /// </summary>
        Undefined,

        /// <summary>
        /// Eine Zusammenstellung von zusammen gehörigen Aufzeichnungen, wie etwa eine kleine DVD Box
        /// mit einer vollständigen Staffel einer Serie.
        /// </summary>
        FeatureSet,

        /// <summary>
        /// Eine größere DVD Box mit einer eventuell wilden Sammlung unterschiedlicher Aufzeichnungen.
        /// </summary>
        Box,

        /// <summary>
        /// Ein Regal oder ein Fach in einem Regal.
        /// </summary>
        Shelf,
    }
}