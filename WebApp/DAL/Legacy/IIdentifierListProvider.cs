using System;
using System.Collections.Generic;


namespace MovieDB
{
    public interface IIdentifierListProvider
    {
        List<Guid> Identifiers { get; }
    }
}
