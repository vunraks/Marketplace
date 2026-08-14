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
[Route("api/v1/disputes")]
[Authorize]
public class DisputesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly RealtimeNotifier _realtime;

    public DisputesController(AppDbContext context, RealtimeNotifier realtime)
    {
        _context = context;
        _realtime = realtime;
    }

    [HttpGet("mine")]
    [ProducesResponseType(typeof(IReadOnlyList<DisputeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var relatedOrderIds = await _context.Orders
            .AsNoTracking()
            .Where(o => o.BuyerId == userId || o.SellerId == userId)
            .Select(o => o.Id)
            .ToListAsync(cancellationToken);

        var reports = await _context.Reports
            .AsNoTracking()
            .Include(r => r.Reporter)
            .Where(r => r.TargetType == ReportTargetType.Order &&
                (r.ReporterId == userId || relatedOrderIds.Contains(r.TargetId)))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(await ToDtosAsync(reports, cancellationToken));
    }

    [HttpGet("admin")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Moderator}")]
    [ProducesResponseType(typeof(IReadOnlyList<DisputeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var reports = await _context.Reports
            .AsNoTracking()
            .Include(r => r.Reporter)
            .Where(r => r.TargetType == ReportTargetType.Order)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(await ToDtosAsync(reports, cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType(typeof(DisputeDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateDisputeRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var reason = request.Reason.Trim();

        if (string.IsNullOrWhiteSpace(reason))
            throw new AppException("Dispute reason is required");

        var order = await _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .Include(o => o.Listing)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && (o.BuyerId == userId || o.SellerId == userId), cancellationToken)
            ?? throw new NotFoundException("Order not found");

        if (order.Status is OrderStatus.Cancelled or OrderStatus.Refunded)
            throw new AppException("This order cannot be disputed");

        if (order.Status == OrderStatus.Completed)
            throw new AppException("Completed orders cannot be disputed; leave a public review instead");

        var existingOpenDispute = await _context.Reports
            .AnyAsync(r =>
                r.TargetType == ReportTargetType.Order &&
                r.TargetId == order.Id &&
                (r.Status == ReportStatus.New || r.Status == ReportStatus.InReview),
                cancellationToken);

        if (existingOpenDispute)
            throw new AppException("This order already has an open dispute");

        var oldStatus = order.Status;
        order.Status = OrderStatus.Disputed;
        order.UpdatedAt = DateTime.UtcNow;

        var report = new Report
        {
            ReporterId = userId,
            TargetType = ReportTargetType.Order,
            TargetId = order.Id,
            Reason = reason,
            Description = request.Description?.Trim(),
            Status = ReportStatus.New
        };

        _context.Reports.Add(report);
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            OldStatus = oldStatus,
            NewStatus = OrderStatus.Disputed,
            ChangedById = userId,
            Comment = reason
        });

        var recipientId = order.BuyerId == userId ? order.SellerId : order.BuyerId;
        var notification = new Notification
        {
            UserId = recipientId,
            Type = "dispute_opened",
            Title = "Открыт спор по заказу",
            Body = $"По заказу {order.OrderNumber} открыт спор: {reason}.",
            DataJson = $$"""{"orderId":"{{order.Id}}","disputeId":"{{report.Id}}"}"""
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync(cancellationToken);
        await _realtime.SendNotificationAsync(notification, cancellationToken);
        await _realtime.SendModerationQueueChangedAsync(cancellationToken);

        return CreatedAtAction(nameof(GetMine), new { id = report.Id }, ToDto(report, order));
    }

    [HttpPut("{id:guid}/resolve")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Moderator}")]
    [ProducesResponseType(typeof(DisputeDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Resolve(Guid id, [FromBody] ResolveDisputeRequest request, CancellationToken cancellationToken)
    {
        var moderatorId = User.GetUserId();
        var resolution = request.Resolution.Trim().ToLowerInvariant();

        var report = await _context.Reports
            .Include(r => r.Reporter)
            .FirstOrDefaultAsync(r => r.Id == id && r.TargetType == ReportTargetType.Order, cancellationToken)
            ?? throw new NotFoundException("Dispute not found");

        if (report.Status is ReportStatus.Resolved or ReportStatus.Rejected)
            throw new AppException("Dispute is already closed");

        var order = await _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .Include(o => o.Listing)
            .FirstOrDefaultAsync(o => o.Id == report.TargetId, cancellationToken)
            ?? throw new NotFoundException("Order not found");

        var oldStatus = order.Status;
        var now = DateTime.UtcNow;

        if (resolution is "refund")
        {
            order.Status = OrderStatus.Refunded;
            order.Listing.StockQuantity += order.Quantity;
            if (order.Listing.Status == ListingStatus.Sold)
                order.Listing.Status = ListingStatus.Active;
        }
        else if (resolution is "complete")
        {
            if (order.Status != OrderStatus.Completed)
            {
                if (order.Buyer.VirtualBalance < order.Amount)
                    throw new AppException("Buyer does not have enough virtual currency");

                order.Buyer.VirtualBalance -= order.Amount;
                order.Seller.VirtualBalance += order.Amount;
            }

            order.Status = OrderStatus.Completed;
            order.CompletedAt ??= now;
        }
        else if (resolution is "reject")
        {
            order.Status = OrderStatus.Created;
            report.Status = ReportStatus.Rejected;
        }
        else
        {
            throw new AppException("Unknown dispute resolution");
        }

        order.UpdatedAt = now;
        report.Status = resolution == "reject" ? ReportStatus.Rejected : ReportStatus.Resolved;
        report.ResolvedById = moderatorId;
        report.ResolutionNote = request.Note?.Trim();
        report.ResolvedAt = now;

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            OldStatus = oldStatus,
            NewStatus = order.Status,
            ChangedById = moderatorId,
            Comment = $"Dispute resolution: {resolution}. {report.ResolutionNote}".Trim()
        });

        var notifications = new[] { order.BuyerId, order.SellerId }
            .Distinct()
            .Select(recipientId => new Notification
            {
                UserId = recipientId,
                Type = "dispute_resolved",
                Title = "Спор по заказу закрыт",
                Body = $"Спор по заказу {order.OrderNumber} закрыт: {resolution}.",
                DataJson = $$"""{"orderId":"{{order.Id}}","disputeId":"{{report.Id}}"}"""
            })
            .ToList();

        _context.Notifications.AddRange(notifications);

        await _context.SaveChangesAsync(cancellationToken);
        await _realtime.SendNotificationsAsync(notifications, cancellationToken);
        await _realtime.SendModerationQueueChangedAsync(cancellationToken);

        return Ok(ToDto(report, order));
    }

    private async Task<IReadOnlyList<DisputeDto>> ToDtosAsync(IReadOnlyList<Report> reports, CancellationToken cancellationToken)
    {
        var orderIds = reports.Select(r => r.TargetId).Distinct().ToList();
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .Include(o => o.Listing)
            .Where(o => orderIds.Contains(o.Id))
            .ToDictionaryAsync(o => o.Id, cancellationToken);

        return reports
            .Where(r => orders.ContainsKey(r.TargetId))
            .Select(r => ToDto(r, orders[r.TargetId]))
            .ToList();
    }

    private static DisputeDto ToDto(Report report, Order order) => new(
        report.Id,
        order.Id,
        order.OrderNumber,
        order.Listing.Title,
        report.Reporter.Username,
        order.Buyer.Username,
        order.Seller.Username,
        report.Reason,
        report.Description,
        report.Status.ToString(),
        order.Status.ToString(),
        report.ResolutionNote,
        report.CreatedAt,
        report.ResolvedAt);
}

public record CreateDisputeRequest(Guid OrderId, string Reason, string? Description);
public record ResolveDisputeRequest(string Resolution, string? Note);
public record DisputeDto(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
    string ListingTitle,
    string ReporterUsername,
    string BuyerUsername,
    string SellerUsername,
    string Reason,
    string? Description,
    string Status,
    string OrderStatus,
    string? ResolutionNote,
    DateTime CreatedAt,
    DateTime? ResolvedAt);
