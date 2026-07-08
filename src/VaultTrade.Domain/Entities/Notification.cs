using VaultTrade.Domain.Common;

namespace VaultTrade.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? DataJson { get; set; }
    public bool IsRead { get; set; }
}
