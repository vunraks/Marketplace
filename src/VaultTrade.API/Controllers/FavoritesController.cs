using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.Application.Common;
using VaultTrade.Application.DTOs.Listings;
using VaultTrade.Domain.Entities;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/favorites")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly AppDbContext _context;

    public FavoritesController(AppDbContext context) => _context = context;

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ListingCardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        var items = await _context.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new ListingCardDto
            {
                Id = f.Listing.Id,
                Title = f.Listing.Title,
                Slug = f.Listing.Slug,
                Price = f.Listing.Price,
                Currency = f.Listing.Currency,
                StockQuantity = f.Listing.StockQuantity,
                Status = f.Listing.Status.ToString(),
                PrimaryImageUrl = f.Listing.Images
                    .OrderByDescending(i => i.IsPrimary)
                    .ThenBy(i => i.SortOrder)
                    .Select(i => i.Url)
                    .FirstOrDefault(),
                CategoryName = f.Listing.Category.Name,
                SellerUsername = f.Listing.Seller.Username,
                SellerRating = f.Listing.Seller.SellerRating != null ? f.Listing.Seller.SellerRating.AverageRating : null,
                CreatedAt = f.Listing.CreatedAt,
                IsFeatured = f.Listing.IsFeatured
            })
            .ToListAsync(cancellationToken);

        return Ok(items);
    }

    [HttpGet("{listingId:guid}")]
    [ProducesResponseType(typeof(FavoriteStateDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> IsFavorite(Guid listingId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var isFavorite = await _context.Favorites.AnyAsync(f => f.UserId == userId && f.ListingId == listingId, cancellationToken);
        return Ok(new FavoriteStateDto(isFavorite));
    }

    [HttpPost("{listingId:guid}")]
    [ProducesResponseType(typeof(FavoriteStateDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Add(Guid listingId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var exists = await _context.Listings.AnyAsync(l => l.Id == listingId, cancellationToken);
        if (!exists)
            throw new NotFoundException("Listing not found");

        var alreadyFavorite = await _context.Favorites.AnyAsync(f => f.UserId == userId && f.ListingId == listingId, cancellationToken);
        if (!alreadyFavorite)
        {
            _context.Favorites.Add(new Favorite { UserId = userId, ListingId = listingId });
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Ok(new FavoriteStateDto(true));
    }

    [HttpDelete("{listingId:guid}")]
    [ProducesResponseType(typeof(FavoriteStateDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Remove(Guid listingId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        await _context.Favorites
            .Where(f => f.UserId == userId && f.ListingId == listingId)
            .ExecuteDeleteAsync(cancellationToken);

        return Ok(new FavoriteStateDto(false));
    }
}

public record FavoriteStateDto(bool IsFavorite);
