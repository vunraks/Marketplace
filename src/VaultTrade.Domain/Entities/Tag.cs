using VaultTrade.Domain.Common;

namespace VaultTrade.Domain.Entities;

public class Tag : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public ICollection<ListingTag> ListingTags { get; set; } = new List<ListingTag>();
}
