using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.Domain.Enums;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/seller/dashboard")]
[Authorize(Policy = "RequireSeller")]
public class SellerDashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public SellerDashboardController(AppDbContext context) => _context = context;

    [HttpGet]
    [ProducesResponseType(typeof(SellerDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var sellerId = User.GetUserId();
        var now = DateTime.UtcNow;
        var weekStart = now.AddDays(-7);

        var listings = _context.Listings.AsNoTracking().Where(l => l.SellerId == sellerId);
        var orders = _context.Orders.AsNoTracking().Where(o => o.SellerId == sellerId);

        var totalListings = await listings.CountAsync(cancellationToken);
        var activeListings = await listings.CountAsync(l => l.Status == ListingStatus.Active, cancellationToken);
        var pendingListings = await listings.CountAsync(l => l.Status == ListingStatus.PendingModeration, cancellationToken);
        var totalViews = await listings.SumAsync(l => (int?)l.ViewCount, cancellationToken) ?? 0;
        var totalOrders = await orders.CountAsync(cancellationToken);
        var openOrders = await orders.CountAsync(o => o.Status == OrderStatus.Created || o.Status == OrderStatus.Paid || o.Status == OrderStatus.Delivered, cancellationToken);
        var disputedOrders = await orders.CountAsync(o => o.Status == OrderStatus.Disputed, cancellationToken);
        var completedOrders = await orders.CountAsync(o => o.Status == OrderStatus.Completed, cancellationToken);
        var revenueTotal = await orders.Where(o => o.Status == OrderStatus.Completed).SumAsync(o => (decimal?)o.Amount, cancellationToken) ?? 0;
        var revenueWeek = await orders.Where(o => o.Status == OrderStatus.Completed && o.CompletedAt >= weekStart).SumAsync(o => (decimal?)o.Amount, cancellationToken) ?? 0;

        var recentOrders = await orders
            .Include(o => o.Buyer)
            .Include(o => o.Listing)
            .OrderByDescending(o => o.CreatedAt)
            .Take(8)
            .Select(o => new SellerOrderDto(
                o.Id,
                o.OrderNumber,
                o.Listing.Title,
                o.Buyer.Username,
                o.Quantity,
                o.Amount,
                o.Currency,
                o.Status.ToString(),
                o.CreatedAt))
            .ToListAsync(cancellationToken);

        var attentionListings = await listings
            .Where(l => l.Status == ListingStatus.PendingModeration || l.StockQuantity <= 2)
            .OrderBy(l => l.StockQuantity)
            .ThenByDescending(l => l.CreatedAt)
            .Take(8)
            .Select(l => new SellerListingAttentionDto(
                l.Id,
                l.Title,
                l.Status.ToString(),
                l.StockQuantity,
                l.ViewCount,
                l.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new SellerDashboardDto(
            new SellerDashboardStatsDto(totalListings, activeListings, pendingListings, totalViews, totalOrders, openOrders, disputedOrders, completedOrders, revenueTotal, revenueWeek),
            recentOrders,
            attentionListings));
    }
}

public record SellerDashboardDto(
    SellerDashboardStatsDto Stats,
    IReadOnlyList<SellerOrderDto> RecentOrders,
    IReadOnlyList<SellerListingAttentionDto> AttentionListings);

public record SellerDashboardStatsDto(
    int TotalListings,
    int ActiveListings,
    int PendingListings,
    int TotalViews,
    int TotalOrders,
    int OpenOrders,
    int DisputedOrders,
    int CompletedOrders,
    decimal RevenueTotal,
    decimal RevenueWeek);

public record SellerOrderDto(Guid Id, string OrderNumber, string ListingTitle, string BuyerUsername, int Quantity, decimal Amount, string Currency, string Status, DateTime CreatedAt);
public record SellerListingAttentionDto(Guid Id, string Title, string Status, int StockQuantity, int ViewCount, DateTime CreatedAt);
