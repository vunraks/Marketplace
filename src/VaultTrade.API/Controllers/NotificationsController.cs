using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificationsController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var items = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(30)
            .Select(n => new NotificationDto(n.Id, n.Type, n.Title, n.Body, n.DataJson, n.IsRead, n.CreatedAt))
            .ToListAsync(cancellationToken);

        var unreadCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);
        return Ok(new NotificationsResult(items, unreadCount));
    }

    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkRead(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in notifications)
            notification.IsRead = true;

        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public record NotificationsResult(IReadOnlyList<NotificationDto> Items, int UnreadCount);
public record NotificationDto(Guid Id, string Type, string Title, string? Body, string? DataJson, bool IsRead, DateTime CreatedAt);
