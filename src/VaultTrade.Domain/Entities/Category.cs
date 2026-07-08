using VaultTrade.Domain.Common;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Domain.Entities;

public class Category : BaseEntity
{
    public Guid? ParentId { get; set; }
    public Category? Parent { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<CategoryAttribute> Attributes { get; set; } = new List<CategoryAttribute>();
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
}
