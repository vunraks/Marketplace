namespace VaultTrade.Domain.Entities;

public class SellerRating
{
    public Guid SellerId { get; set; }
    public User Seller { get; set; } = null!;
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int Rating1Count { get; set; }
    public int Rating2Count { get; set; }
    public int Rating3Count { get; set; }
    public int Rating4Count { get; set; }
    public int Rating5Count { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
