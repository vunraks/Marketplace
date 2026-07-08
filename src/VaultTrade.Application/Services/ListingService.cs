using AutoMapper;
using VaultTrade.Application.Common;
using VaultTrade.Application.DTOs.Listings;
using VaultTrade.Application.Helpers;
using VaultTrade.Application.Interfaces;
using VaultTrade.Domain.Constants;
using VaultTrade.Domain.Entities;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Application.Services;

public class ListingService : IListingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ListingService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<ListingCardDto>> GetListingsAsync(ListingFilterRequest filter, CancellationToken cancellationToken = default)
    {
        var page = Math.Max(filter.Page, 1);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var (items, total) = await _unitOfWork.Listings.GetFilteredAsync(
            filter.CategoryId,
            filter.MinPrice,
            filter.MaxPrice,
            filter.Search,
            filter.Status ?? ListingStatus.Active.ToString(),
            filter.SortBy ?? "createdAt",
            filter.SortOrder ?? "desc",
            page,
            pageSize,
            cancellationToken);

        return new PagedResult<ListingCardDto>
        {
            Items = _mapper.Map<IReadOnlyList<ListingCardDto>>(items),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ListingDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var listing = await _unitOfWork.Listings.GetByIdWithDetailsAsync(id, cancellationToken)
            ?? throw new NotFoundException("Listing not found");

        listing.ViewCount++;
        _unitOfWork.Listings.Update(listing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ListingDetailDto>(listing);
    }

    public async Task<ListingDetailDto> CreateAsync(Guid sellerId, CreateListingRequest request, CancellationToken cancellationToken = default)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException("Category not found");

        var slug = SlugHelper.AppendUniqueSuffix(SlugHelper.GenerateSlug(request.Title));

        var listing = new Listing
        {
            SellerId = sellerId,
            CategoryId = category.Id,
            Title = request.Title.Trim(),
            Slug = slug,
            Description = request.Description.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            DeliveryInfo = request.DeliveryInfo?.Trim(),
            Status = ListingStatus.PendingModeration
        };

        if (request.Attributes is not null)
        {
            foreach (var attr in request.Attributes)
            {
                listing.AttributeValues.Add(new ListingAttributeValue
                {
                    CategoryAttributeId = attr.CategoryAttributeId,
                    Value = attr.Value
                });
            }
        }

        if (request.Tags is not null)
        {
            var tagNames = request.Tags
                .Select(t => t.Trim())
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var tagSlugs = tagNames.Select(SlugHelper.GenerateSlug).ToList();
            var existingTags = await _unitOfWork.Tags.GetByNamesOrSlugsAsync(tagNames, tagSlugs, cancellationToken);
            var existingByName = existingTags.ToDictionary(t => t.Name, StringComparer.OrdinalIgnoreCase);
            var existingBySlug = existingTags.ToDictionary(t => t.Slug, StringComparer.OrdinalIgnoreCase);

            foreach (var tagName in tagNames)
            {
                var tagSlug = SlugHelper.GenerateSlug(tagName);

                if (!existingByName.TryGetValue(tagName, out var tag) &&
                    !existingBySlug.TryGetValue(tagSlug, out tag))
                {
                    tag = new Tag { Name = tagName, Slug = tagSlug };
                    existingByName[tag.Name] = tag;
                    existingBySlug[tag.Slug] = tag;
                }

                listing.ListingTags.Add(new ListingTag
                {
                    Tag = tag
                });
            }
        }

        await _unitOfWork.Listings.AddAsync(listing, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _unitOfWork.Listings.GetByIdWithDetailsAsync(listing.Id, cancellationToken);
        return _mapper.Map<ListingDetailDto>(created!);
    }

    public async Task<ListingDetailDto> UpdateAsync(Guid sellerId, Guid listingId, UpdateListingRequest request, CancellationToken cancellationToken = default)
    {
        var listing = await GetOwnedListingAsync(sellerId, listingId, cancellationToken);

        if (listing.Status is ListingStatus.Sold)
            throw new AppException("Sold listing cannot be edited");

        var category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new NotFoundException("Category not found");

        listing.CategoryId = category.Id;
        listing.Title = request.Title.Trim();
        listing.Description = request.Description.Trim();
        listing.Price = request.Price;
        listing.StockQuantity = request.StockQuantity;
        listing.DeliveryInfo = request.DeliveryInfo?.Trim();
        listing.UpdatedAt = DateTime.UtcNow;
        listing.Status = ListingStatus.PendingModeration;

        _unitOfWork.Listings.Update(listing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _unitOfWork.Listings.GetByIdWithDetailsAsync(listingId, cancellationToken);
        return _mapper.Map<ListingDetailDto>(updated!);
    }

    public async Task DeleteAsync(Guid userId, Guid listingId, CancellationToken cancellationToken = default)
    {
        var listing = await GetOwnedListingAsync(userId, listingId, cancellationToken);
        _unitOfWork.Listings.Remove(listing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ListingDetailDto> UpdateStatusAsync(Guid userId, Guid listingId, string status, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<ListingStatus>(status, true, out var newStatus))
            throw new AppException("Invalid listing status");

        var listing = await _unitOfWork.Listings.GetByIdWithDetailsAsync(listingId, cancellationToken)
            ?? throw new NotFoundException("Listing not found");

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        var isOwner = listing.SellerId == userId;
        var isModerator = user.UserRoles.Any(r => r.Role.Name is RoleNames.Moderator or RoleNames.Admin);

        if (!isOwner && !isModerator)
            throw new ForbiddenException();

        if (isOwner && newStatus is not (ListingStatus.Archived or ListingStatus.Draft))
            throw new ForbiddenException("Owner can only archive or save as draft");

        listing.Status = newStatus;
        listing.UpdatedAt = DateTime.UtcNow;

        if (newStatus == ListingStatus.Active)
            listing.PublishedAt = DateTime.UtcNow;

        _unitOfWork.Listings.Update(listing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ListingDetailDto>(listing);
    }

    public async Task<PagedResult<ListingCardDto>> GetMyListingsAsync(Guid sellerId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, total) = await _unitOfWork.Listings.GetBySellerAsync(sellerId, page, pageSize, cancellationToken);

        return new PagedResult<ListingCardDto>
        {
            Items = _mapper.Map<IReadOnlyList<ListingCardDto>>(items),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    private async Task<Listing> GetOwnedListingAsync(Guid sellerId, Guid listingId, CancellationToken cancellationToken)
    {
        var listing = await _unitOfWork.Listings.GetByIdWithDetailsAsync(listingId, cancellationToken)
            ?? throw new NotFoundException("Listing not found");

        if (listing.SellerId != sellerId)
            throw new ForbiddenException("You can only modify your own listings");

        return listing;
    }
}
