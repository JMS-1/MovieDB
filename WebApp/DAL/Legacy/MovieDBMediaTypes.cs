namespace MovieDB
{
    /// <summary>
    /// Die Medien, auf die eine Aufzeichnung vorgenommen wurde.
    /// </summary>
	public enum MediaTypes
	{
        /// <summary>
        /// Unbekannt.
        /// </summary>
		Unknown,

        /// <summary>
        /// Video auf CD niedriger Qualit�t (VCD).
        /// </summary>
		VideoCD,

        /// <summary>
        /// Video auf CD hoher Qualit�t (SVCD).
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