namespace VaultTrade.Domain.Entities;

public class ConversationParticipant
{
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime? LastReadAt { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
