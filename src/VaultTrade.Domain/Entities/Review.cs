using VaultTrade.Domain.Common;

namespace VaultTrade.Domain.Entities;

public class Review : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid ReviewerId { get; set; }
    public User Reviewer { get; set; } = null!;
    public Guid SellerId { get; set; }
    public User Seller { get; set; } = null!;
    public short Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsVisible { get; set; } = true;
}
