

namespace WebApp.Models
{
    /// <summary>
    /// Die einzelne Arten der physikalischen Ablage.
    /// </summary>
    public enum StoreType : byte
    {
        /// <summary>
        /// Unbekannt.
        /// </summary>
        Undefined,

        /// <summary>
        /// Video auf CD niedriger Qualität (VCD).
        /// </summary>
        VideoCD,

        /// <summary>
        /// Video auf CD hoher Qualität (SVCD).
        /// </summary>
        SuperVideoCD,

        /// <summary>
        /// Selbstaufgenommene DVD.
        /// </summary>
        RecordedDVD,

        /// <summary>
        /// Gekaufte DVD.
        /// </summary>
        DVD,

        /// <summary>
        /// Gekaufte BD.
        /// </summary>
        BluRay,
    }
}