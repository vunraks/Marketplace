namespace VaultTrade.Domain.Enums;

public enum OrderStatus
{
    Created = 0,
    Paid = 1,
    Delivered = 2,
    Completed = 3,
    Disputed = 4,
    Cancelled = 5,
    Refunded = 6
}
