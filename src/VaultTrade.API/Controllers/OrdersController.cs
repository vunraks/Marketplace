using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
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

    public OrdersController(AppDbContext context) => _context = context;

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

        if (listing.Status != ListingStatus.Active)
            throw new AppException("Listing is not available for purchase");

        if (listing.StockQuantity < quantity)
            throw new AppException("Not enough items in stock");

        var amount = listing.Price * quantity;

        listing.StockQuantity -= quantity;
        if (listing.StockQuantity == 0)
            listing.Status = ListingStatus.Sold;

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

        var conversation = await GetOrCreateConversationAsync(listing.Id, null, buyerId, listing.SellerId, cancellationToken);
        conversation.Order = order;

        _context.Orders.Add(order);
        _context.Notifications.Add(new Notification
        {
            UserId = listing.SellerId,
            Type = "order_created",
            Title = "Новый заказ",
            Body = $"Покупатель создал заказ {order.OrderNumber}.",
            DataJson = $$"""{"orderId":"{{order.Id}}","listingId":"{{listing.Id}}"}"""
        });
        await _context.SaveChangesAsync(cancellationToken);

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

        var buyerUpdated = await _context.Users
            .Where(u => u.Id == order.BuyerId && u.VirtualBalance >= order.Amount)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.VirtualBalance, u => u.VirtualBalance - order.Amount)
                .SetProperty(u => u.UpdatedAt, now),
                cancellationToken);

        if (buyerUpdated == 0)
            throw new AppException("Not enough virtual currency");

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

        _context.Notifications.Add(new Notification
        {
            UserId = order.SellerId,
            Type = "order_completed",
            Title = "Покупатель подтвердил заказ",
            Body = $"Заказ {order.OrderNumber} завершён, средства зачислены.",
            DataJson = $$"""{"orderId":"{{order.Id}}","listingId":"{{order.ListingId}}"}"""
        });

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

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

    private async Task<Conversation> GetOrCreateConversationAsync(Guid listingId, Guid? orderId, Guid buyerId, Guid sellerId, CancellationToken cancellationToken)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c =>
                c.ListingId == listingId &&
                c.Participants.Any(p => p.UserId == buyerId) &&
                c.Participants.Any(p => p.UserId == sellerId),
                cancellationToken);

        if (conversation is not null)
        {
            conversation.OrderId ??= orderId;
            return conversation;
        }

        conversation = new Conversation
        {
            ListingId = listingId,
            OrderId = orderId,
            Participants =
            {
                new ConversationParticipant { UserId = buyerId },
                new ConversationParticipant { UserId = sellerId }
            }
        };

        _context.Conversations.Add(conversation);
        return conversation;
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
