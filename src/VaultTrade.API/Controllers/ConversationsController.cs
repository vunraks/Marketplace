using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.API.Services;
using VaultTrade.Application.Common;
using VaultTrade.Domain.Constants;
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

    [HttpGet("support")]
    public async Task<IActionResult> GetSupport(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var conversationId = await FindSupportConversationIdAsync(userId, cancellationToken);

        if (conversationId == Guid.Empty)
            return Ok(EmptySupportConversationDto());

        var conversation = await LoadConversationAsync(conversationId, cancellationToken);
        return Ok(ToDto(conversation));
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

        var conversationId = await FindBuyerSellerConversationIdAsync(listingId, userId, listing.SellerId, cancellationToken);
        if (conversationId == Guid.Empty)
            return Ok(EmptyConversationDto(listingId, listing.Title));

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

    [HttpPost("{conversationId:guid}/close")]
    public async Task<IActionResult> Close(Guid conversationId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var conversation = await _context.Conversations
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .Include(c => c.Messages.OrderBy(m => m.CreatedAt)).ThenInclude(m => m.Sender)
            .Include(c => c.Listing)
            .FirstOrDefaultAsync(c => c.Id == conversationId, cancellationToken)
            ?? throw new NotFoundException("Conversation not found");

        var isSupportConversation = conversation.ListingId is null && conversation.OrderId is null;
        var canCloseSupport = isSupportConversation && await IsStaffAsync(userId, cancellationToken);

        if (conversation.Listing?.SellerId != userId && !canCloseSupport)
            throw new ForbiddenException(isSupportConversation ? "Only support staff can close this chat" : "Only seller can close this chat");

        if (!conversation.IsClosed)
        {
            conversation.IsClosed = true;
            conversation.ClosedAt = DateTime.UtcNow;
            conversation.ClosedById = userId;
            conversation.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        var dto = ToDto(conversation);
        await _realtime.SendConversationUpdatedAsync(conversation.Participants.Select(p => p.UserId), dto, cancellationToken);

        return Ok(dto);
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

        var activeOrderId = await _context.Orders
            .Where(o =>
                o.ListingId == listingId &&
                o.BuyerId == userId &&
                (o.Status == OrderStatus.Created || o.Status == OrderStatus.Completed || o.Status == OrderStatus.Disputed))
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => (Guid?)o.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var openResult = await GetOrOpenBuyerSellerConversationAsync(listingId, userId, listing.SellerId, activeOrderId, cancellationToken);
        var openedNotification = openResult.WasOpened
            ? new Notification
            {
                UserId = listing.SellerId,
                Type = "chat_opened",
                Title = "Чат открыт",
                Body = $"Покупатель открыл чат по товару \"{listing.Title}\" {openResult.OpenedAt:dd.MM.yyyy HH:mm} UTC.",
                DataJson = $$"""{"conversationId":"{{openResult.ConversationId}}","listingId":"{{listingId}}"}"""
            }
            : null;

        return await AddMessageAsync(openResult.ConversationId, userId, request.Content.Trim(), cancellationToken, openedNotification);
    }

    [HttpPost("support/messages")]
    public async Task<IActionResult> SendToSupport([FromBody] SendMessageRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new AppException("Message cannot be empty");

        var userId = User.GetUserId();
        var conversationId = await GetOrOpenSupportConversationAsync(userId, cancellationToken);
        return await AddMessageAsync(conversationId, userId, request.Content.Trim(), cancellationToken);
    }

    private async Task<IActionResult> AddMessageAsync(
        Guid conversationId,
        Guid userId,
        string content,
        CancellationToken cancellationToken,
        Notification? extraNotification = null)
    {
        var conversationInfo = await _context.Conversations
            .Where(c => c.Id == conversationId)
            .Select(c => new { c.IsClosed, IsSupport = c.ListingId == null && c.OrderId == null })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Conversation not found");

        if (conversationInfo.IsClosed)
            throw new AppException("Chat is closed");

        var removedSupportParticipantIds = new List<Guid>();
        var staffAnsweredSupport = conversationInfo.IsSupport && await IsStaffAsync(userId, cancellationToken);
        if (staffAnsweredSupport)
            removedSupportParticipantIds = await AssignSupportConversationAsync(conversationId, userId, cancellationToken);

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

        if (extraNotification is not null)
            notifications.Add(extraNotification);

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync(cancellationToken);

        var conversation = await LoadConversationAsync(conversationId, cancellationToken);
        var dto = ToDto(conversation);
        await _realtime.SendConversationUpdatedAsync(
            conversation.Participants.Select(p => p.UserId).Concat(removedSupportParticipantIds).Distinct(),
            dto,
            cancellationToken);
        await _realtime.SendNotificationsAsync(notifications, cancellationToken);

        return Ok(dto);
    }

    private async Task<List<Guid>> AssignSupportConversationAsync(Guid conversationId, Guid assigneeId, CancellationToken cancellationToken)
    {
        var extraStaffParticipants = await _context.ConversationParticipants
            .Where(p =>
                p.ConversationId == conversationId &&
                p.UserId != assigneeId &&
                p.User.UserRoles.Any(ur => ur.Role.Name == RoleNames.Admin || ur.Role.Name == RoleNames.Moderator))
            .ToListAsync(cancellationToken);

        if (extraStaffParticipants.Count > 0)
            _context.ConversationParticipants.RemoveRange(extraStaffParticipants);

        return extraStaffParticipants.Select(p => p.UserId).ToList();
    }

    private async Task<Guid> FindBuyerSellerConversationIdAsync(
        Guid listingId,
        Guid buyerId,
        Guid sellerId,
        CancellationToken cancellationToken)
    {
        return await _context.Conversations
            .Where(c =>
                c.ListingId == listingId &&
                c.Participants.Any(p => p.UserId == buyerId) &&
                c.Participants.Any(p => p.UserId == sellerId))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => c.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Guid> FindSupportConversationIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _context.Conversations
            .Where(c =>
                c.ListingId == null &&
                c.OrderId == null &&
                !c.IsClosed &&
                c.Participants.Any(p => p.UserId == userId) &&
                c.Participants.Any(p => p.UserId != userId && p.User.UserRoles.Any(ur => ur.Role.Name == RoleNames.Admin || ur.Role.Name == RoleNames.Moderator)))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => c.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Guid> GetOrOpenSupportConversationAsync(Guid userId, CancellationToken cancellationToken)
    {
        var existingId = await FindSupportConversationIdAsync(userId, cancellationToken);
        if (existingId != Guid.Empty)
            return existingId;

        var staffIds = await _context.Users
            .Where(u => u.IsActive && !u.IsBlocked && u.UserRoles.Any(ur => ur.Role.Name == RoleNames.Admin || ur.Role.Name == RoleNames.Moderator))
            .OrderBy(u => u.UserRoles.Any(ur => ur.Role.Name == RoleNames.Admin) ? 0 : 1)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        if (staffIds.Count == 0)
            throw new AppException("Support is temporarily unavailable");

        var now = DateTime.UtcNow;
        var conversation = new Conversation { OpenedAt = now };
        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync(cancellationToken);

        var participantIds = new[] { userId }.Concat(staffIds).Distinct().ToList();
        _context.ConversationParticipants.AddRange(participantIds.Select(participantId => new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = participantId,
            JoinedAt = now
        }));
        await _context.SaveChangesAsync(cancellationToken);

        return conversation.Id;
    }

    private async Task<bool> IsStaffAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _context.Users
            .AnyAsync(u => u.Id == userId && u.UserRoles.Any(ur => ur.Role.Name == RoleNames.Admin || ur.Role.Name == RoleNames.Moderator), cancellationToken);
    }

    private async Task<ConversationOpenResult> GetOrOpenBuyerSellerConversationAsync(
        Guid listingId,
        Guid buyerId,
        Guid sellerId,
        Guid? orderId,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c =>
                c.ListingId == listingId &&
                c.Participants.Any(p => p.UserId == buyerId) &&
                c.Participants.Any(p => p.UserId == sellerId),
                cancellationToken);

        if (conversation is not null)
        {
            var wasOpened = conversation.IsClosed;
            conversation.OrderId ??= orderId;
            if (conversation.IsClosed)
            {
                conversation.IsClosed = false;
                conversation.OpenedAt = now;
                conversation.ClosedAt = null;
                conversation.ClosedById = null;
                conversation.UpdatedAt = now;
            }

            return new ConversationOpenResult(conversation.Id, wasOpened, conversation.OpenedAt);
        }

        var newConversation = new Conversation { ListingId = listingId, OrderId = orderId, OpenedAt = now };
        _context.Conversations.Add(newConversation);
        await _context.SaveChangesAsync(cancellationToken);

        _context.ConversationParticipants.AddRange(
            new ConversationParticipant { ConversationId = newConversation.Id, UserId = buyerId },
            new ConversationParticipant { ConversationId = newConversation.Id, UserId = sellerId });
        await _context.SaveChangesAsync(cancellationToken);

        return new ConversationOpenResult(newConversation.Id, true, newConversation.OpenedAt);
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
        null,
        listingTitle,
        false,
        DateTime.UtcNow,
        false,
        null,
        Array.Empty<ParticipantDto>(),
        Array.Empty<MessageDto>());

    private static ConversationDto EmptySupportConversationDto() => new(
        Guid.Empty,
        null,
        null,
        null,
        "Поддержка VaultTrade",
        true,
        DateTime.UtcNow,
        false,
        null,
        Array.Empty<ParticipantDto>(),
        Array.Empty<MessageDto>());

    private static ConversationDto ToDto(Conversation conversation) => new(
        conversation.Id,
        conversation.ListingId,
        conversation.OrderId,
        conversation.Listing?.SellerId,
        conversation.Listing?.Title ?? (conversation.ListingId is null && conversation.OrderId is null ? "Поддержка VaultTrade" : null),
        conversation.ListingId is null && conversation.OrderId is null,
        conversation.OpenedAt,
        conversation.IsClosed,
        conversation.ClosedAt,
        conversation.Participants.Select(p => new ParticipantDto(p.UserId, p.User?.Username ?? string.Empty)).ToList(),
        conversation.Messages.Where(m => !m.IsDeleted).OrderBy(m => m.CreatedAt).Select(m =>
            new MessageDto(m.Id, m.SenderId, m.Sender?.Username ?? string.Empty, m.Content, m.CreatedAt)).ToList());
}

public record SendMessageRequest(string Content);
public record ConversationDto(
    Guid Id,
    Guid? ListingId,
    Guid? OrderId,
    Guid? SellerId,
    string? ListingTitle,
    bool IsSupport,
    DateTime OpenedAt,
    bool IsClosed,
    DateTime? ClosedAt,
    IReadOnlyList<ParticipantDto> Participants,
    IReadOnlyList<MessageDto> Messages);
public record ParticipantDto(Guid UserId, string Username);
public record MessageDto(Guid Id, Guid SenderId, string SenderUsername, string Content, DateTime CreatedAt);
public record ConversationOpenResult(Guid ConversationId, bool WasOpened, DateTime OpenedAt);
