using System.Linq;


namespace WebApp.DAL
{
    /// <summary>
    /// Einige Hilfsmethoden zum Zugriff auf die Datenbank.
    /// </summary>
    public static class DatabaseExtensions
    {
        /// <summary>
        /// Prüft, ob die Datenbank bereits Entitäten enthält.
        /// </summary>
        /// <param name="context">Die Informationen zur aktuellen Umgebung.</param>
        /// <returns>Gesetzt, wenn die Datenbank noch keine Entitäten enthält.</returns>
        public static bool TestEmpty( this IRequestContext context )
        {
            // Test all tables - most likely first
            if (context.Recordings.Query().Any())
                return false;
            if (context.Languages.Query().Any())
                return false;
            if (context.Genres.Query().Any())
                return false;

            // All clear
            return true;
        }
    }
}