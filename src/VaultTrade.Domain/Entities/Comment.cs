using VaultTrade.Domain.Common;

namespace VaultTrade.Domain.Entities;

public class Comment : BaseEntity
{
    public Guid ListingId { get; set; }
    public Listing Listing { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? ParentId { get; set; }
    public Comment? Parent { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public bool IsHidden { get; set; }

    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}
