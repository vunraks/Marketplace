using VaultTrade.Domain.Common;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Domain.Entities;

public class CategoryAttribute : BaseEntity
{
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public AttributeType AttributeType { get; set; }
    public string? OptionsJson { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }

    public ICollection<ListingAttributeValue> Values { get; set; } = new List<ListingAttributeValue>();
}
