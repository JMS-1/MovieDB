using System;


namespace MovieDB
{
    [Serializable]
    public class RecordingFilter
    {
        public enum SortModes
        {
            NoSort,
            SortTitleAscending,
            SortTitleDescending,
            SortDateAscending,
            SortDateDescinding
        }

        public SortModes SortMode { get; set; }

        public string[] Genres { get; set; }

        public string Volltext { get; set; }

        public string Series { get; set; }

        public string Language { get; set; }

        public bool IsRent { get; set; }

        public RecordingFilter()
        {
            // Setup
            SortMode = SortModes.NoSort;
            Genres = new string[0];
        }
    }
}