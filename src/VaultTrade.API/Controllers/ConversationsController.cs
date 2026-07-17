using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.Application.Common;
using VaultTrade.Domain.Entities;
using VaultTrade.Domain.Enums;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/conversations")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConversationsController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetMy(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var conversations = await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .Include(c => c.Messages.OrderBy(m => m.CreatedAt)).ThenInclude(m => m.Sender)
            .Include(c => c.Listing)
            .AsSplitQuery()
            .Where(c => c.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(c => c.Messages.Max(m => (DateTime?)m.CreatedAt) ?? c.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(conversations.Select(ToDto).ToList());
    }

    [HttpGet("listings/{listingId:guid}")]
    public async Task<IActionResult> GetForListing(Guid listingId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == listingId, cancellationToken)
            ?? throw new NotFoundException("Listing not found");

        var conversationId = await GetOrCreateConversationIdAsync(listingId, userId, listing.SellerId, cancellationToken);
        var conversation = await LoadConversationAsync(conversationId, cancellationToken);

        return Ok(ToDto(conversation));
    }

    [HttpPost("listings/{listingId:guid}/messages")]
    public async Task<IActionResult> SendToListing(Guid listingId, [FromBody] SendMessageRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new AppException("Message cannot be empty");

        var userId = User.GetUserId();
        var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == listingId, cancellationToken)
            ?? throw new NotFoundException("Listing not found");

        var conversationId = await GetOrCreateConversationIdAsync(listingId, userId, listing.SellerId, cancellationToken);

        _context.Messages.Add(new Message
        {
            ConversationId = conversationId,
            SenderId = userId,
            Content = request.Content.Trim(),
            MessageType = MessageType.Text
        });

        var recipientIds = await _context.ConversationParticipants
            .Where(p => p.ConversationId == conversationId && p.UserId != userId)
            .Select(p => p.UserId)
            .ToListAsync(cancellationToken);

        foreach (var recipientId in recipientIds)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = recipientId,
                Type = "message",
                Title = "Новое сообщение",
                Body = request.Content.Trim(),
                DataJson = $$"""{"conversationId":"{{conversationId}}","listingId":"{{listingId}}"}"""
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        var conversation = await LoadConversationAsync(conversationId, cancellationToken);
        return Ok(ToDto(conversation));
    }

    private async Task<Guid> GetOrCreateConversationIdAsync(Guid listingId, Guid userId, Guid sellerId, CancellationToken cancellationToken)
    {
        var participantIds = userId == sellerId
            ? new[] { sellerId }
            : new[] { userId, sellerId };

        var conversationId = await _context.Conversations
            .Where(c =>
                c.ListingId == listingId &&
                participantIds.All(id => c.Participants.Any(p => p.UserId == id)))
            .Select(c => c.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (conversationId != Guid.Empty)
            return conversationId;

        var conversation = new Conversation { ListingId = listingId };
        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync(cancellationToken);

        _context.ConversationParticipants.AddRange(participantIds.Distinct().Select(participantId =>
            new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = participantId
            }));
        await _context.SaveChangesAsync(cancellationToken);

        return conversation.Id;
    }

    private async Task<Conversation> LoadConversationAsync(Guid conversationId, CancellationToken cancellationToken)
    {
        return await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .Include(c => c.Messages.OrderBy(m => m.CreatedAt)).ThenInclude(m => m.Sender)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.Id == conversationId, cancellationToken)
            ?? throw new NotFoundException("Conversation not found");
    }

    private static ConversationDto ToDto(Conversation conversation) => new(
        conversation.Id,
        conversation.ListingId,
        conversation.OrderId,
        conversation.Participants.Select(p => new ParticipantDto(p.UserId, p.User?.Username ?? string.Empty)).ToList(),
        conversation.Messages.Where(m => !m.IsDeleted).OrderBy(m => m.CreatedAt).Select(m =>
            new MessageDto(m.Id, m.SenderId, m.Sender?.Username ?? string.Empty, m.Content, m.CreatedAt)).ToList());
}

public record SendMessageRequest(string Content);
public record ConversationDto(Guid Id, Guid? ListingId, Guid? OrderId, IReadOnlyList<ParticipantDto> Participants, IReadOnlyList<MessageDto> Messages);
public record ParticipantDto(Guid UserId, string Username);
public record MessageDto(Guid Id, Guid SenderId, string SenderUsername, string Content, DateTime CreatedAt);
