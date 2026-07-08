using VaultTrade.Domain.Common;

namespace VaultTrade.Domain.Entities;

public class Conversation : BaseEntity
{
    public Guid? ListingId { get; set; }
    public Listing? Listing { get; set; }
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }

    public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
