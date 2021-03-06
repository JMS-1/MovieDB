﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;


namespace WebApp.Models
{
    /// <summary>
    /// Beschreibt eine Serie oder zusammengehörige Aufzeichnungen.
    /// </summary>
    [Table( "Series" )]
    public class Series : ILinkHolder
    {
        /// <summary>
        /// Das Trennzeichen zwischen Ebenen von Serien - als <see cref="char"/>.
        /// </summary>
        public const char JoinCharacter = '>';

        /// <summary>
        /// Die eindeutige Kennung der Serie.
        /// </summary>
        [Required, Key]
        [Column( "Id" )]
        public Guid UniqueIdentifier { get; set; }

        /// <summary>
        /// Der relative Name der Serie.
        /// </summary>
        [Required, StringLength( 50, MinimumLength = 1 )]
        [Column( "Name" )]
        public string Name { get; set; }

        /// <summary>
        /// Die Beschreibung der Serie.
        /// </summary>
        [StringLength( 2000 )]
        [Column( "Description" )]
        public string Description { get; set; }

        /// <summary>
        /// Die übergeordnete Serie.
        /// </summary>
        [Column( "Parent" )]
        public Guid? ParentIdentifier { get; set; }

        /// <summary>
        /// Die übergeordnete Serie.
        /// </summary>
        public virtual Series ParentSeries { get; set; }

        /// <summary>
        /// Alle Verweise.
        /// </summary>
        public virtual ICollection<Link> Links { get; set; }

        /// <summary>
        /// Meldet den vollen Namen der Serie.
        /// </summary>
        public string FullName
        {
            get
            {
                var parent = ParentSeries;
                if (parent == null)
                    return Name;
                else
                    return string.Format( "{0} {1} {2}", parent.FullName, JoinCharacter, Name );
            }
        }

        /// <summary>
        /// Erstellt eine neue Serie.
        /// </summary>
        public Series()
        {
            UniqueIdentifier = Guid.NewGuid();
            Links = new List<Link>();
        }

        /// <summary>
        /// Wird beim Anlegen des Datenbankmodells aufgerufen.
        /// </summary>
        /// <param name="modelBuilder">Die Feinsteuerung der Modellerzeugung.</param>
        internal static void BuildModel( DbModelBuilder modelBuilder )
        {
            modelBuilder
                .Entity<Series>()
                .HasOptional( c => c.ParentSeries )
                .WithMany()
                .HasForeignKey( c => c.ParentIdentifier )
                .WillCascadeOnDelete( false );

            modelBuilder
                .Entity<Series>()
                .HasMany( s => s.Links )
                .WithRequired()
                .HasForeignKey( l => l.UniqueIdentifier )
                .WillCascadeOnDelete( true );
        }
    }
}