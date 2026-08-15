using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.API.Services;
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
    private readonly RealtimeNotifier _realtime;

    public ConversationsController(AppDbContext context, RealtimeNotifier realtime)
    {
        _context = context;
        _realtime = realtime;
    }

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
            .Where(c =>
                c.Participants.Any(p => p.UserId == userId) &&
                c.Participants.Count >= 2)
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

        if (userId == listing.SellerId)
        {
            var sellerConversationId = await _context.Conversations
                .Where(c =>
                    c.ListingId == listingId &&
                    c.Participants.Any(p => p.UserId == userId) &&
                    c.Participants.Count >= 2)
                .OrderByDescending(c => c.Messages.Max(m => (DateTime?)m.CreatedAt) ?? c.CreatedAt)
                .Select(c => c.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (sellerConversationId == Guid.Empty)
                return Ok(EmptyConversationDto(listingId, listing.Title));

            var sellerConversation = await LoadConversationAsync(sellerConversationId, cancellationToken);
            return Ok(ToDto(sellerConversation));
        }

        var conversationId = await GetOrCreateBuyerSellerConversationIdAsync(listingId, userId, listing.SellerId, cancellationToken);
        var conversation = await LoadConversationAsync(conversationId, cancellationToken);
        return Ok(ToDto(conversation));
    }

    [HttpPost("{conversationId:guid}/messages")]
    public async Task<IActionResult> SendToConversation(Guid conversationId, [FromBody] SendMessageRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new AppException("Message cannot be empty");

        var userId = User.GetUserId();
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId, cancellationToken);

        if (!isParticipant)
            throw new ForbiddenException("You are not a participant of this conversation");

        return await AddMessageAsync(conversationId, userId, request.Content.Trim(), cancellationToken);
    }

    [HttpPost("listings/{listingId:guid}/messages")]
    public async Task<IActionResult> SendToListing(Guid listingId, [FromBody] SendMessageRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new AppException("Message cannot be empty");

        var userId = User.GetUserId();
        var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == listingId, cancellationToken)
            ?? throw new NotFoundException("Listing not found");

        if (userId == listing.SellerId)
            throw new AppException("Open the buyer conversation from Chats to reply");

        var conversationId = await GetOrCreateBuyerSellerConversationIdAsync(listingId, userId, listing.SellerId, cancellationToken);
        return await AddMessageAsync(conversationId, userId, request.Content.Trim(), cancellationToken);
    }

    private async Task<IActionResult> AddMessageAsync(Guid conversationId, Guid userId, string content, CancellationToken cancellationToken)
    {
        _context.Messages.Add(new Message
        {
            ConversationId = conversationId,
            SenderId = userId,
            Content = content,
            MessageType = MessageType.Text
        });

        var listingId = await _context.Conversations
            .Where(c => c.Id == conversationId)
            .Select(c => c.ListingId)
            .FirstOrDefaultAsync(cancellationToken);

        var recipientIds = await _context.ConversationParticipants
            .Where(p => p.ConversationId == conversationId && p.UserId != userId)
            .Select(p => p.UserId)
            .ToListAsync(cancellationToken);

        var notifications = recipientIds.Select(recipientId => new Notification
        {
            UserId = recipientId,
            Type = "message",
            Title = "Новое сообщение",
            Body = content,
            DataJson = $$"""{"conversationId":"{{conversationId}}","listingId":"{{listingId}}"}"""
        }).ToList();

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync(cancellationToken);

        var conversation = await LoadConversationAsync(conversationId, cancellationToken);
        var dto = ToDto(conversation);
        await _realtime.SendConversationUpdatedAsync(conversation.Participants.Select(p => p.UserId), dto, cancellationToken);
        await _realtime.SendNotificationsAsync(notifications, cancellationToken);

        return Ok(dto);
    }

    private async Task<Guid> GetOrCreateBuyerSellerConversationIdAsync(
        Guid listingId,
        Guid buyerId,
        Guid sellerId,
        CancellationToken cancellationToken)
    {
        var conversationId = await _context.Conversations
            .Where(c =>
                c.ListingId == listingId &&
                c.Participants.Any(p => p.UserId == buyerId) &&
                c.Participants.Any(p => p.UserId == sellerId))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => c.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (conversationId != Guid.Empty)
            return conversationId;

        var conversation = new Conversation { ListingId = listingId };
        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync(cancellationToken);

        _context.ConversationParticipants.AddRange(
            new ConversationParticipant { ConversationId = conversation.Id, UserId = buyerId },
            new ConversationParticipant { ConversationId = conversation.Id, UserId = sellerId });
        await _context.SaveChangesAsync(cancellationToken);

        return conversation.Id;
    }

    private async Task<Conversation> LoadConversationAsync(Guid conversationId, CancellationToken cancellationToken)
    {
        return await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .Include(c => c.Messages.OrderBy(m => m.CreatedAt)).ThenInclude(m => m.Sender)
            .Include(c => c.Listing)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.Id == conversationId, cancellationToken)
            ?? throw new NotFoundException("Conversation not found");
    }

    private static ConversationDto EmptyConversationDto(Guid listingId, string listingTitle) => new(
        Guid.Empty,
        listingId,
        null,
        listingTitle,
        Array.Empty<ParticipantDto>(),
        Array.Empty<MessageDto>());

    private static ConversationDto ToDto(Conversation conversation) => new(
        conversation.Id,
        conversation.ListingId,
        conversation.OrderId,
        conversation.Listing?.Title,
        conversation.Participants.Select(p => new ParticipantDto(p.UserId, p.User?.Username ?? string.Empty)).ToList(),
        conversation.Messages.Where(m => !m.IsDeleted).OrderBy(m => m.CreatedAt).Select(m =>
            new MessageDto(m.Id, m.SenderId, m.Sender?.Username ?? string.Empty, m.Content, m.CreatedAt)).ToList());
}

public record SendMessageRequest(string Content);
public record ConversationDto(
    Guid Id,
    Guid? ListingId,
    Guid? OrderId,
    string? ListingTitle,
    IReadOnlyList<ParticipantDto> Participants,
    IReadOnlyList<MessageDto> Messages);
public record ParticipantDto(Guid UserId, string Username);
public record MessageDto(Guid Id, Guid SenderId, string SenderUsername, string Content, DateTime CreatedAt);
