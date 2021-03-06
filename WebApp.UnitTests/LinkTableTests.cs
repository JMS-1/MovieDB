﻿using System;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using NUnit.Framework;
using WebApp.Models;


namespace WebApp.UnitTests
{
    /// <summary>
    /// Prüft den Umgang mit der Tabelle der Verweise.
    /// </summary>
    [TestFixture]
    public class LinkTableTests : DatabaseTestBase
    {
        /// <summary>
        /// Liest alle Verweise ein - diese Funktionalität wird produktiv nicht benötigt und dient
        /// nur zu Testzwecken.
        /// </summary>
        [Test]
        public void CanReadLinks()
        {
            TestContext.Links.ToArray();
        }

        /// <summary>
        /// Der Verweis muss auch ein solcher sein.
        /// </summary>
        /// <param name="testUrl">Der zu prüfende Verweis.</param>
        [TestCase( null )]
        [TestCase( "hello" )]
        [TestCase( "" )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void UrlIsRequiredAndMustBeAHyperlink( string testUrl )
        {
            TestContext.Series.Add( new Series { Name = "A1" } ).Links.Add( new Link { Name = "A1", Index = 0, Url = testUrl } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Namen von Verweisen müssen nicht eindeutig sein.
        /// </summary>
        [Test]
        public void CanHaveDuplicateNames()
        {
            var series = TestContext.Series.Add( new Series { Name = "A3" } );
            series.Links.Add( new Link { Name = "A3", Url = "http://www.psimarron.net" } );
            series.Links.Add( new Link { Name = "A3", Url = "http://www.jochen-manns.de" } );

            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Verweise der Verweise müssen nicht eindeutig sein.
        /// </summary>
        [Test]
        public void CanHaveDuplicateHyperlinks()
        {
            var series = TestContext.Series.Add( new Series { Name = "A4" } );
            series.Links.Add( new Link { Name = "A4", Url = "http://www.psimarron.net" } );
            series.Links.Add( new Link { Name = "B4", Url = "http://www.psimarron.net" } );

            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Verweise müssen nicht eindeutig sein.
        /// </summary>
        [Test]
        public void CanHaveDuplicateLinks()
        {
            var series = TestContext.Series.Add( new Series { Name = "A5" } );
            series.Links.Add( new Link { Name = "A5", Url = "http://www.psimarron.net" } );
            series.Links.Add( new Link { Name = "A5", Url = "http://www.psimarron.net" } );

            TestContext.SaveChanges();
        }

        /// <summary>
        /// Eine Serie kann mit Verweisen angelegt werden.
        /// </summary>
        [Test]
        public void CanCreateSeriesWithLinks()
        {
            var series = TestContext.Series.Add( new Series { Name = "A2" } );
            var seriesId = series.UniqueIdentifier;
            series.Links.Add( new Link { Name = "A2", Url = "http://www.psimarron.net" } );
            series.Links.Add( new Link { Name = "B2", Url = "http://www.jochen-manns.de" } );

            TestContext.SaveChanges();

            Recreate();

            var links = TestContext.Series.Include( s => s.Links ).Single( s => s.UniqueIdentifier == seriesId ).Links.ToDictionary( l => l.Name );

            Assert.AreEqual( 2, links.Count, "#links" );
            Assert.AreEqual( "http://www.psimarron.net", links["A2"].Url, "first" );
            Assert.AreEqual( "http://www.jochen-manns.de", links["B2"].Url, "second" );
        }

        /// <summary>
        /// Eine Aufzeichnung kann mit Verweisen angelegt werden.
        /// </summary>
        [Test]
        public void CanCreateRecordingWithLinks()
        {
            var recordings = TestContext.Recordings.Add( new Recording { CreationTime = DateTime.UtcNow, Name = "A9", Store = new Store() } );
            var recordingId = recordings.UniqueIdentifier;
            recordings.Links.Add( new Link { Name = "A9", Url = "http://www.psimarron.net" } );
            recordings.Links.Add( new Link { Name = "B9", Url = "http://www.jochen-manns.de" } );

            TestContext.SaveChanges();

            Recreate();

            var links = TestContext.Recordings.Include( r => r.Links ).Single( r => r.UniqueIdentifier == recordingId ).Links.ToDictionary( l => l.Name );

            Assert.AreEqual( 2, links.Count, "#links" );
            Assert.AreEqual( "http://www.psimarron.net", links["A9"].Url, "first" );
            Assert.AreEqual( "http://www.jochen-manns.de", links["B9"].Url, "second" );
        }


        /// <summary>
        /// Die Ordnungszahlen der Verweise müssen unterschiedlich sein.
        /// </summary>
        [Test, ExpectedException( typeof( DbUpdateException ) )]
        public void MustHaveUniqueIndex()
        {
            var series = TestContext.Series.Add( new Series { Name = "A6" } );
            series.Links.Add( new Link { Name = "A6", Url = "http://www.psimarron.net" } );
            series.Links.Add( new Link { Name = "B6", Url = "http://www.jochen-manns.de" } );

            TestContext.Configuration.ValidateOnSaveEnabled = false;
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Der Name des Verweises muss gesetzt werden und muss zwischen 1 und 100 Zeichen haben.
        /// </summary>
        /// <param name="name">Der Name für den Test.</param>
        [TestCase( null )]
        [TestCase( "" )]
        [TestCase( "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1" )]
        [ExpectedException( typeof( DbEntityValidationException ) )]
        public void NameMustHaveBetween1And100Charaters( string name )
        {
            TestContext.Series.Add( new Series { Name = "A7" } ).Links.Add( new Link { Name = name, Url = "http://www.psimarron.net" } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung ist optional.
        /// </summary>
        [Test]
        public void DescriptionIsOptionalAndLimitedTo2000Characters()
        {
            TestContext.Series.Add( new Series { Name = "A7" } ).Links.Add( new Link { Name = "A7", Url = "http://www.psimarron.net", Description = null } );
            TestContext.Series.Add( new Series { Name = "B7" } ).Links.Add( new Link { Name = "B7", Url = "http://www.psimarron.net", Description = string.Empty } );
            TestContext.Series.Add( new Series { Name = "C7" } ).Links.Add( new Link { Name = "C7", Url = "http://www.psimarron.net", Description = new string( 'A', 2000 ) } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Beschreibung kann nicht mehr als 2000 Zeichen haben.
        /// </summary>
        [Test, ExpectedException( typeof( DbEntityValidationException ) )]
        public void DescriptionIsLimitedTo2000Characters()
        {
            TestContext.Series.Add( new Series { Name = "A8" } ).Links.Add( new Link { Name = "A8", Url = "http://www.psimarron.net", Description = new string( 'A', 2001 ) } );
            TestContext.SaveChanges();
        }

        /// <summary>
        /// Die Verweise einer Serie werden mit dieser gelöscht.
        /// </summary>
        [Test]
        public void LinksWillBeDeletedWithSeries()
        {
            var linkCount = TestContext.Links.Count();

            var series = TestContext.Series.Add( new Series { Name = "A10" } );
            var seriesId = series.UniqueIdentifier;
            series.Links.Add( new Link { Name = "A10", Url = "http://www.psimarron.net" } );
            series.Links.Add( new Link { Name = "B10", Url = "http://www.jochen-manns.de" } );

            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( linkCount + 2, TestContext.Links.Count(), "before" );

            TestContext.Entry( new Series { UniqueIdentifier = seriesId } ).State = EntityState.Deleted;
            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( linkCount, TestContext.Links.Count(), "after" );
        }

        /// <summary>
        /// Die Verweise einer Aufzeichnung werden mit dieser gelöscht.
        /// </summary>
        [Test]
        public void LinksWillBeDeletedWithRecording()
        {
            var linkCount = TestContext.Links.Count();

            var recording = TestContext.Recordings.Add( new Recording { CreationTime = DateTime.UtcNow, Name = "A11", Store = new Store() } );
            var recordingId = recording.UniqueIdentifier;
            recording.Links.Add( new Link { Name = "A11", Url = "http://www.psimarron.net" } );
            recording.Links.Add( new Link { Name = "B11", Url = "http://www.jochen-manns.de" } );

            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( linkCount + 2, TestContext.Links.Count(), "before" );

            TestContext.Entry( new Recording { UniqueIdentifier = recordingId } ).State = EntityState.Deleted;
            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( linkCount, TestContext.Links.Count(), "after" );
        }

        /// <summary>
        /// Verweise können auch über eine Aktualisierung gelöscht werden.
        /// </summary>
        [Test]
        public void LinksWillBeDeletedOnUpdate()
        {
            var linkCount = TestContext.Links.Count();

            var recording = TestContext.Recordings.Add( new Recording { CreationTime = DateTime.UtcNow, Name = "A12", Store = new Store() } );
            var recordingId = recording.UniqueIdentifier;
            recording.Links.Add( new Link { Name = "A12", Url = "http://www.psimarron.net" } );
            recording.Links.Add( new Link { Name = "B12", Url = "http://www.jochen-manns.de" } );
            recording.Links.Add( new Link { Name = "C12", Url = "http://www.zdf.de" } );
            recording.Links.Add( new Link { Name = "D12", Url = "http://www.ard.de" } );

            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( linkCount + 4, TestContext.Links.Count(), "before" );

            recording = TestContext.Recordings.Include( r => r.Links ).Single( r => r.UniqueIdentifier == recordingId );
            
            recording.Links.Clear();
            recording.Links.Add( new Link { Name = "E12", Url = "http://www.microsoft.com" } );
            recording.Links.Add( new Link { Name = "F12", Url = "http://www.github.com" } );

            TestContext.Entry( recording ).State = EntityState.Modified;
            TestContext.SaveChanges();

            Recreate();

            Assert.AreEqual( linkCount + 2, TestContext.Links.Count(), "after" );
        }
    }
}
