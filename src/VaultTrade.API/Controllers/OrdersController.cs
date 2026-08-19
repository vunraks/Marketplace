using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.API.Services;
using VaultTrade.Application.Common;
using VaultTrade.Application.Helpers;
using VaultTrade.Domain.Entities;
using VaultTrade.Domain.Enums;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly RealtimeNotifier _realtime;

    public OrdersController(AppDbContext context, RealtimeNotifier realtime)
    {
        _context = context;
        _realtime = realtime;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var buyerId = User.GetUserId();
        var quantity = Math.Max(request.Quantity, 1);

        var listing = await _context.Listings
            .Include(l => l.Seller)
            .FirstOrDefaultAsync(l => l.Id == request.ListingId, cancellationToken)
            ?? throw new NotFoundException("Listing not found");

        if (listing.SellerId == buyerId)
            throw new AppException("You cannot buy your own listing");

        var existingOrder = await _context.Orders
            .AsNoTracking()
            .Where(o =>
                o.ListingId == listing.Id &&
                o.BuyerId == buyerId &&
                o.Status == OrderStatus.Created)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingOrder is not null)
            return Ok(ToDto(existingOrder));

        if (listing.Status != ListingStatus.Active)
            throw new AppException("Listing is not available for purchase");

        if (listing.StockQuantity < quantity)
            throw new AppException("Not enough items in stock");

        var amount = listing.Price * quantity;
        var buyerBalance = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == buyerId)
            .Select(u => u.VirtualBalance)
            .FirstOrDefaultAsync(cancellationToken);

        if (buyerBalance < amount)
            throw new AppException("Not enough virtual currency");

        var order = new Order
        {
            OrderNumber = OrderNumberGenerator.Generate(),
            ListingId = listing.Id,
            BuyerId = buyerId,
            SellerId = listing.SellerId,
            Quantity = quantity,
            Amount = amount,
            Currency = listing.Currency,
            BuyerNote = request.BuyerNote?.Trim(),
            Status = OrderStatus.Created
        };

        order.StatusHistory.Add(new OrderStatusHistory
        {
            NewStatus = OrderStatus.Created,
            ChangedById = buyerId,
            Comment = "Order created, payment is pending buyer confirmation"
        });

        var notification = new Notification
        {
            UserId = listing.SellerId,
            Type = "order_created",
            Title = "Новый заказ",
            Body = $"Покупатель создал заказ {order.OrderNumber}. Чат откроется, когда покупатель напишет продавцу.",
            DataJson = $$"""{"orderId":"{{order.Id}}","listingId":"{{listing.Id}}"}"""
        };

        _context.Orders.Add(order);
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);
        await _realtime.SendNotificationAsync(notification, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToDto(order));
    }

    [HttpPost("{id:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid id, CancellationToken cancellationToken)
    {
        var buyerId = User.GetUserId();
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id && o.BuyerId == buyerId, cancellationToken)
            ?? throw new NotFoundException("Order not found");

        if (order.Status == OrderStatus.Completed)
            return Ok(ToDto(order));

        if (order.Status is OrderStatus.Cancelled or OrderStatus.Refunded)
            throw new AppException("Order cannot be confirmed");

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        var now = DateTime.UtcNow;

        var buyerUpdated = await _context.Users
            .Where(u => u.Id == order.BuyerId && u.VirtualBalance >= order.Amount)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.VirtualBalance, u => u.VirtualBalance - order.Amount)
                .SetProperty(u => u.UpdatedAt, now),
                cancellationToken);

        if (buyerUpdated == 0)
            throw new AppException("Not enough virtual currency");

        var listingUpdated = await _context.Listings
            .Where(l => l.Id == order.ListingId && l.Status == ListingStatus.Active && l.StockQuantity >= order.Quantity)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(l => l.StockQuantity, l => l.StockQuantity - order.Quantity)
                .SetProperty(l => l.Status, l => l.StockQuantity == order.Quantity ? ListingStatus.Sold : l.Status)
                .SetProperty(l => l.UpdatedAt, now),
                cancellationToken);

        if (listingUpdated == 0)
            throw new AppException("Not enough items in stock");

        var orderUpdated = await _context.Orders
            .Where(o => o.Id == order.Id && o.BuyerId == buyerId && o.Status == OrderStatus.Created)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(o => o.Status, OrderStatus.Completed)
                .SetProperty(o => o.CompletedAt, now)
                .SetProperty(o => o.UpdatedAt, now),
                cancellationToken);

        if (orderUpdated == 0)
        {
            var currentOrder = await _context.Orders
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == order.Id && o.BuyerId == buyerId, cancellationToken)
                ?? throw new NotFoundException("Order not found");

            if (currentOrder.Status == OrderStatus.Completed)
                return Ok(ToDto(currentOrder));

            throw new AppException("Order cannot be confirmed");
        }

        var sellerUpdated = await _context.Users
            .Where(u => u.Id == order.SellerId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.VirtualBalance, u => u.VirtualBalance + order.Amount)
                .SetProperty(u => u.UpdatedAt, now),
                cancellationToken);

        if (sellerUpdated == 0)
            throw new NotFoundException("Seller not found");

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            OldStatus = OrderStatus.Created,
            NewStatus = OrderStatus.Completed,
            ChangedById = buyerId,
            Comment = "Buyer confirmed delivery"
        });

        var notification = new Notification
        {
            UserId = order.SellerId,
            Type = "order_completed",
            Title = "Покупатель подтвердил заказ",
            Body = $"Заказ {order.OrderNumber} завершен, средства зачислены.",
            DataJson = $$"""{"orderId":"{{order.Id}}","listingId":"{{order.ListingId}}"}"""
        };

        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await _realtime.SendNotificationAsync(notification, cancellationToken);

        var completedOrder = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == order.Id && o.BuyerId == buyerId, cancellationToken)
            ?? throw new NotFoundException("Order not found");

        return Ok(ToDto(completedOrder));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var order = await _context.Orders
            .Include(o => o.Listing)
            .FirstOrDefaultAsync(o => o.Id == id && (o.BuyerId == userId || o.SellerId == userId), cancellationToken)
            ?? throw new NotFoundException("Order not found");

        return Ok(ToDto(order));
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Listing)
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .Where(o => o.BuyerId == userId || o.SellerId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderHistoryDto(
                o.Id,
                o.OrderNumber,
                o.ListingId,
                o.Listing.Title,
                o.BuyerId,
                o.Buyer.Username,
                o.SellerId,
                o.Seller.Username,
                o.Quantity,
                o.Amount,
                o.Currency,
                o.Status.ToString(),
                o.CreatedAt,
                o.CompletedAt,
                o.BuyerId == userId ? "buyer" : "seller"))
            .ToListAsync(cancellationToken);

        return Ok(orders);
    }

    [HttpGet("listings/{listingId:guid}/active")]
    public async Task<IActionResult> GetActiveForListing(Guid listingId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var order = await _context.Orders
            .AsNoTracking()
            .Where(o =>
                o.ListingId == listingId &&
                o.BuyerId == userId &&
                (o.Status == OrderStatus.Created || o.Status == OrderStatus.Completed || o.Status == OrderStatus.Disputed))
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return Ok(order is null ? null : ToDto(order));
    }

    private static OrderDto ToDto(Order order) => new(
        order.Id,
        order.OrderNumber,
        order.ListingId,
        order.Quantity,
        order.Amount,
        order.Currency,
        order.Status.ToString(),
        order.CreatedAt);
}

public record CreateOrderRequest(Guid ListingId, int Quantity, string? BuyerNote);
public record OrderDto(Guid Id, string OrderNumber, Guid ListingId, int Quantity, decimal Amount, string Currency, string Status, DateTime CreatedAt);
public record OrderHistoryDto(
    Guid Id,
    string OrderNumber,
    Guid ListingId,
    string ListingTitle,
    Guid BuyerId,
    string BuyerUsername,
    Guid SellerId,
    string SellerUsername,
    int Quantity,
    decimal Amount,
    string Currency,
    string Status,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    string Side);
