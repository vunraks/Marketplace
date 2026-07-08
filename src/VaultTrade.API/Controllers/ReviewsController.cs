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
[Route("api/v1/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context) => _context = context;

    [HttpGet("sellers/{sellerId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetForSeller(Guid sellerId, CancellationToken cancellationToken)
    {
        var reviews = await _context.Reviews
            .Include(r => r.Reviewer)
            .Where(r => r.SellerId == sellerId && r.IsVisible)
            .OrderByDescending(r => r.CreatedAt)
            .Take(30)
            .Select(r => new ReviewDto(r.Id, r.Reviewer.Username, r.Rating, r.Comment, r.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(reviews);
    }

    [HttpPost("orders/{orderId:guid}")]
    [Authorize]
    public async Task<IActionResult> Create(Guid orderId, [FromBody] CreateReviewRequest request, CancellationToken cancellationToken)
    {
        if (request.Rating is < 1 or > 5)
            throw new AppException("Rating must be between 1 and 5");

        var reviewerId = User.GetUserId();
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == reviewerId, cancellationToken)
            ?? throw new NotFoundException("Order not found");

        if (order.Status != OrderStatus.Completed)
            throw new AppException("You can leave a review only after confirming the order");

        var exists = await _context.Reviews.AnyAsync(r => r.OrderId == orderId, cancellationToken);
        if (exists)
            throw new ConflictException("Review already exists");

        var review = new Review
        {
            OrderId = order.Id,
            ReviewerId = reviewerId,
            SellerId = order.SellerId,
            Rating = request.Rating,
            Comment = request.Comment?.Trim()
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);
        await RecalculateSellerRatingAsync(order.SellerId, cancellationToken);

        return Created(string.Empty, new { review.Id });
    }

    private async Task RecalculateSellerRatingAsync(Guid sellerId, CancellationToken cancellationToken)
    {
        var visibleReviews = await _context.Reviews
            .Where(r => r.SellerId == sellerId && r.IsVisible)
            .ToListAsync(cancellationToken);

        var rating = await _context.SellerRatings.FirstOrDefaultAsync(r => r.SellerId == sellerId, cancellationToken)
            ?? new SellerRating { SellerId = sellerId };

        rating.TotalReviews = visibleReviews.Count;
        rating.AverageRating = visibleReviews.Count == 0 ? 0 : (decimal)visibleReviews.Average(r => r.Rating);
        rating.Rating1Count = visibleReviews.Count(r => r.Rating == 1);
        rating.Rating2Count = visibleReviews.Count(r => r.Rating == 2);
        rating.Rating3Count = visibleReviews.Count(r => r.Rating == 3);
        rating.Rating4Count = visibleReviews.Count(r => r.Rating == 4);
        rating.Rating5Count = visibleReviews.Count(r => r.Rating == 5);
        rating.UpdatedAt = DateTime.UtcNow;

        if (_context.Entry(rating).State == EntityState.Detached)
            _context.SellerRatings.Add(rating);

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public record CreateReviewRequest(short Rating, string? Comment);
public record ReviewDto(Guid Id, string ReviewerUsername, short Rating, string? Comment, DateTime CreatedAt);
