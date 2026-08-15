using VaultTrade.Domain.Common;

namespace VaultTrade.Domain.Entities;

public class ProfilePost : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
}
