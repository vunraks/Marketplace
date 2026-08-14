using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Hubs;
using VaultTrade.Domain.Entities;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Services;

public class RealtimeNotifier
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _notifications;

    public RealtimeNotifier(AppDbContext context, IHubContext<NotificationHub> notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task SendNotificationAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == notification.UserId && !n.IsRead, cancellationToken);

        var dto = new RealtimeNotificationDto(
            notification.Id,
            notification.Type,
            notification.Title,
            notification.Body,
            notification.DataJson,
            notification.IsRead,
            notification.CreatedAt);

        await _notifications.Clients.Group(UserGroup(notification.UserId))
            .SendAsync("NotificationReceived", dto, unreadCount, cancellationToken);
        await _notifications.Clients.Group(UserGroup(notification.UserId))
            .SendAsync("UnreadCountChanged", unreadCount, cancellationToken);
    }

    public async Task SendNotificationsAsync(IEnumerable<Notification> notifications, CancellationToken cancellationToken = default)
    {
        foreach (var notification in notifications)
            await SendNotificationAsync(notification, cancellationToken);
    }

    public async Task SendConversationUpdatedAsync(IEnumerable<Guid> userIds, object conversation, CancellationToken cancellationToken = default)
    {
        foreach (var userId in userIds.Distinct())
        {
            await _notifications.Clients.Group(UserGroup(userId))
                .SendAsync("ConversationUpdated", conversation, cancellationToken);
        }
    }

    public async Task SendNotificationReadStateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);

        await _notifications.Clients.Group(UserGroup(userId))
            .SendAsync("UnreadCountChanged", unreadCount, cancellationToken);
    }

    public async Task SendModerationQueueChangedAsync(CancellationToken cancellationToken = default)
    {
        await _notifications.Clients.Group("moderators")
            .SendAsync("ModerationQueueChanged", cancellationToken);
    }

    public static string UserGroup(Guid userId) => $"user-{userId}";
}

public record RealtimeNotificationDto(
    Guid Id,
    string Type,
    string Title,
    string? Body,
    string? DataJson,
    bool IsRead,
    DateTime CreatedAt);
