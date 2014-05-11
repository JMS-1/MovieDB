using System.Web.Http;
using Microsoft.Practices.Unity;
using Unity.WebApi;
using WebApp.DAL;


namespace WebApp
{
    /// <summary>
    /// Hilfsklasse zur Konfiguration des IoC.
    /// </summary>
    public static class UnityConfig
    {
        /// <summary>
        /// Setzt den Haupt-IoC auf und meldet diesen zur Nutzung durch die <i>WebAPI</i> an.
        /// </summary>
        /// <param name="config">Die <i>WebAPI</i> Gesamtkonfiguration.</param>
        public static void RegisterComponents( HttpConfiguration config )
        {
            // Create Unity IoC
            var container = new UnityContainer();

            // Register our types
            container.RegisterType<IRequestContext, DatabaseRequestContext>( new HierarchicalLifetimeManager() );

            // Attach to the WebAPI runtime
            config.DependencyResolver = new UnityDependencyResolver( container );
        }
    }
}