using System;
using WebApp.Controllers;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Eine Basisklasse für Tests der einzelnen Controller.
    /// </summary>
    /// <typeparam name="TControllerType">Die Art des eingesetzten Controllers.</typeparam>
    public abstract class ControllerTestBase<TControllerType> : SampleDatabaseTestBase where TControllerType : ControllerWithDatabase, IDisposable, new()
    {
        /// <summary>
        /// Der zu testende Controller.
        /// </summary>
        protected TControllerType Controller { get; private set; }

        /// <summary>
        /// Wird vor jedem Test aufgerufen.
        /// </summary>
        public override void BeforeEachTest()
        {
            base.BeforeEachTest();

            using (TestContext)
                TestContext = null;

            using (Controller)
                Controller = new TControllerType();
        }

        /// <summary>
        /// Wird nach jedem Test aufgerufen.
        /// </summary>
        public override void AfterEachTest()
        {
            using (Controller)
                Controller = null;

            base.AfterEachTest();
        }
    }
}
