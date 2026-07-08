using VaultTrade.Domain.Common;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Domain.Entities;

public class Listing : BaseEntity
{
    public Guid SellerId { get; set; }
    public User Seller { get; set; } = null!;
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "RUB";
    public int StockQuantity { get; set; } = 1;
    public ListingStatus Status { get; set; } = ListingStatus.Draft;
    public string? RejectionReason { get; set; }
    public int ViewCount { get; set; }
    public bool IsFeatured { get; set; }
    public string? DeliveryInfo { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ModeratedAt { get; set; }
    public Guid? ModeratedById { get; set; }
    public User? ModeratedBy { get; set; }

    public ICollection<ListingImage> Images { get; set; } = new List<ListingImage>();
    public ICollection<ListingAttributeValue> AttributeValues { get; set; } = new List<ListingAttributeValue>();
    public ICollection<ListingTag> ListingTags { get; set; } = new List<ListingTag>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
