using System;
using System.Web;
using System.Web.Http;
using WebApp.DAL;


namespace WebApp
{
    /// <summary>
    /// Modul zur einmaligen Initialisierung der Anwendung.
    /// </summary>
    public class Starter : IHttpModule
    {
        /// <summary>
        /// Eine eindeutige Kennung für die Initialisierung.
        /// </summary>
        private static readonly string _InitializationKey = Guid.NewGuid().ToString();

        /// <summary>
        /// Beendet die Nutzung der Modulinstanz andgültig.
        /// </summary>
        void IHttpModule.Dispose()
        {
        }

        /// <summary>
        /// Wird zur Initialisierung des Moduls aufgerufen.
        /// </summary>
        /// <param name="context">Die ASP.NET Anwendung, die gerade aktiv ist.</param>
        void IHttpModule.Init( HttpApplication context )
        {
            // Lazy check for finished initialisation
            var application = context.Application;
            if (application[_InitializationKey] != null)
                return;

            // Make sure only one thread initializes
            application.Lock();
            try
            {
                // Maybe we are late
                if (application[_InitializationKey] != null)
                    return;

                // We use implicit route bindings
                GlobalConfiguration.Configure( HttpConfigurationExtensions.MapHttpAttributeRoutes );

                // Prepare database
                Database.CreateOnce();

                // Mark as initialized
                application[_InitializationKey] = true;
            }
            finally
            {
                application.UnLock();
            }
        }
    }
}