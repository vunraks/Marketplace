using VaultTrade.Domain.Common;

namespace VaultTrade.Domain.Entities;

public class PromoCode : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BonusAmount { get; set; }
    public int? MaxRedemptions { get; set; }
    public int RedeemedCount { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public ICollection<PromoCodeRedemption> Redemptions { get; set; } = new List<PromoCodeRedemption>();
}
