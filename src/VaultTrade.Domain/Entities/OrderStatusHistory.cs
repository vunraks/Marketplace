using VaultTrade.Domain.Common;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Domain.Entities;

public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public OrderStatus? OldStatus { get; set; }
    public OrderStatus NewStatus { get; set; }
    public Guid? ChangedById { get; set; }
    public User? ChangedBy { get; set; }
    public string? Comment { get; set; }
}
