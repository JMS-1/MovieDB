using System;
using System.Web;
using System.Web.Http;
using Microsoft.Web.Infrastructure.DynamicModuleHelper;


// Meldet die Start-Methode für diese ASP.NET Anwendung an.
[assembly: PreApplicationStartMethod( typeof( WebApp.GlobalStartupCode ), "Startup" )]


namespace WebApp
{
    /// <summary>
    /// Hilfsklasse zum Ersetzen der <i>Global.Asax</i>. So können wir den gesamten Startvorgang
    /// etwas besser im Programmcode kontrollieren.
    /// </summary>
    public static class GlobalStartupCode
    {
        /// <summary>
        /// Modul zur einmaligen Initialisierung der Anwendung.
        /// </summary>
        private class Starter : IHttpModule
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

                    // Not really necessary but just to see how it's going
                    UnityConfig.RegisterComponents( GlobalConfiguration.Configuration );

                    // We use implicit route bindings
                    GlobalConfiguration.Configure( config => config.MapHttpAttributeRoutes() );

                    // Mark as initialized
                    application[_InitializationKey] = true;
                }
                finally
                {
                    application.UnLock();
                }
            }
        }

        /// <summary>
        /// Meldet beim Starten der Anwendung ein Hilfsmodul an.
        /// </summary>
        public static void Startup()
        {
            DynamicModuleUtility.RegisterModule( typeof( Starter ) );
        }
    }
}