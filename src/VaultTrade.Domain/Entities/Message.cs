using VaultTrade.Domain.Common;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Domain.Entities;

public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;
    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public MessageType MessageType { get; set; } = MessageType.Text;
    public string? AttachmentUrl { get; set; }
    public bool IsDeleted { get; set; }
}
