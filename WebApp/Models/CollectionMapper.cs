using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;


namespace WebApp.Models
{
    /// <summary>
    /// Projektion einer Auflistung auf eine andere.
    /// </summary>
    internal static class CollectionMapper
    {
        /// <summary>
        /// Erstellt eine neue Projektion.
        /// </summary>
        /// <typeparam name="TRawType">Die Art der tatsächlich verwalteten Elemente.</typeparam>
        /// <typeparam name="TClientType">Die für den Client sichtbare Art der Elemente.</typeparam>
        /// <param name="rawCollection">Die Verwaltung der Elemente.</param>
        /// <param name="rawToClient">Wandelt ein Element in die Sicht des Clients.</param>
        /// <param name="clientToRaw">Erzeugt zu einem Element die Sicht des Clients.</param>
        public static ICollection<TClientType> Create<TRawType, TClientType>( Func<ICollection<TRawType>> rawCollection, Func<TRawType, TClientType> rawToClient, Func<TClientType, TRawType> clientToRaw )
        {
            return new Implementation<TRawType, TClientType>( rawCollection, rawToClient, clientToRaw );
        }

        /// <summary>
        /// Projektion einer Auflistung auf eine andere.
        /// </summary>
        /// <typeparam name="TRawType">Die Art der tatsächlich verwalteten Elemente.</typeparam>
        /// <typeparam name="TClientType">Die für den Client sichtbare Art der Elemente.</typeparam>
        private class Implementation<TRawType, TClientType> : ICollection<TClientType>
        {
            /// <summary>
            /// Erlaubt den Zugriff auf die eigentliche Verwaltung.
            /// </summary>
            private readonly Func<ICollection<TRawType>> m_rawCollection;

            /// <summary>
            /// Methode zum Umwandeln der verwalteten Elemente in die Sicht des Clients.
            /// </summary>
            private readonly Func<TRawType, TClientType> m_toClient;

            /// <summary>
            /// Methode zum Erzeugen der eigentlichen Elemente aus den Clientdaten.
            /// </summary>
            private readonly Func<TClientType, TRawType> m_toRaw;

            /// <summary>
            /// Erstellt eine neue Projektion.
            /// </summary>
            /// <param name="rawCollection">Die Verwaltung der Elemente.</param>
            /// <param name="rawToClient">Wandelt ein Element in die Sicht des Clients.</param>
            /// <param name="clientToRaw">Erzeugt zu einem Element die Sicht des Clients.</param>
            public Implementation( Func<ICollection<TRawType>> rawCollection, Func<TRawType, TClientType> rawToClient, Func<TClientType, TRawType> clientToRaw )
            {
                m_rawCollection = rawCollection;
                m_toClient = rawToClient;
                m_toRaw = clientToRaw;
            }

            /// <summary>
            /// Ergänz ein Element.
            /// </summary>
            /// <param name="item">Das gewünschte Element.</param>
            public void Add( TClientType item )
            {
                m_rawCollection().Add( m_toRaw( item ) );
            }

            /// <summary>
            /// Entfernt alle Elemente.
            /// </summary>
            public void Clear()
            {
                m_rawCollection().Clear();
            }

            /// <summary>
            /// Prüft, ob ein Element in Verwendung ist.
            /// </summary>
            /// <param name="item">Ein Element.</param>
            /// <returns>Gesetzt, wenn dieses Element bereits in Verwendung ist.</returns>
            public bool Contains( TClientType item )
            {
                return m_rawCollection().Any( raw => Equals( m_toClient( raw ), item ) );
            }

            /// <summary>
            /// Extrahiert die Elemente.
            /// </summary>
            /// <param name="array">Ein bestehendes Feld von Elementen.</param>
            /// <param name="arrayIndex">Der Index des ersten zu befüllenden Elementes.</param>
            public void CopyTo( TClientType[] array, int arrayIndex )
            {
                foreach (var raw in m_rawCollection())
                    array[arrayIndex++] = m_toClient( raw );
            }

            /// <summary>
            /// Meldet die Anzahl der Elemente.
            /// </summary>
            public int Count { get { return m_rawCollection().Count; } }

            /// <summary>
            /// Gesetzt, wenn diese Auflistung nur gelesen werden kann.
            /// </summary>
            public bool IsReadOnly { get { return m_rawCollection().IsReadOnly; } }

            /// <summary>
            /// Entfernt ein Element.
            /// </summary>
            /// <param name="item">Das zu entfernende Element.</param>
            /// <returns>Gesetzt, wenn ein Element entfernt wurde.</returns>
            public bool Remove( TClientType item )
            {
                var rawCollection = m_rawCollection();

                foreach (var raw in rawCollection)
                    if (Equals( m_toClient( raw ), item ))
                        return rawCollection.Remove( raw );

                return false;
            }

            /// <summary>
            /// Meldet eine Auflistung über alle Elemente.
            /// </summary>
            /// <returns>Die gewünschte Auflistung.</returns>
            public IEnumerator<TClientType> GetEnumerator()
            {
                return m_rawCollection().Select( m_toClient ).GetEnumerator();
            }

            /// <summary>
            /// Meldet eine Auflistung über alle Elemente.
            /// </summary>
            /// <returns>Die gewünschte Auflistung.</returns>
            IEnumerator IEnumerable.GetEnumerator()
            {
                return GetEnumerator();
            }
        }
    }
}