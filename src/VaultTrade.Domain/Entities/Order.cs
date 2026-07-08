using VaultTrade.Domain.Common;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid ListingId { get; set; }
    public Listing Listing { get; set; } = null!;
    public Guid BuyerId { get; set; }
    public User Buyer { get; set; } = null!;
    public Guid SellerId { get; set; }
    public User Seller { get; set; } = null!;
    public int Quantity { get; set; } = 1;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "RUB";
    public OrderStatus Status { get; set; } = OrderStatus.Created;
    public string? DeliveryData { get; set; }
    public string? BuyerNote { get; set; }
    public string? SellerNote { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    public Review? Review { get; set; }
}
