namespace VaultTrade.Domain.Entities;

public class PromoCodeRedemption
{
    public Guid PromoCodeId { get; set; }
    public PromoCode PromoCode { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public decimal BonusAmount { get; set; }
    public DateTime RedeemedAt { get; set; } = DateTime.UtcNow;
}
