namespace VaultTrade.Application.DTOs.Listings;

public class ListingCardDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PrimaryImageUrl { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string SellerUsername { get; set; } = string.Empty;
    public decimal? SellerRating { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsFeatured { get; set; }
}

public class ListingImageDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public class ListingAttributeValueDto
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class ListingDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? DeliveryInfo { get; set; }
    public int ViewCount { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public Guid SellerId { get; set; }
    public string SellerUsername { get; set; } = string.Empty;
    public decimal? SellerRating { get; set; }

    public IReadOnlyList<ListingImageDto> Images { get; set; } = Array.Empty<ListingImageDto>();

    public IReadOnlyList<ListingAttributeValueDto> Attributes { get; set; } = Array.Empty<ListingAttributeValueDto>();

    public IReadOnlyList<string> Tags { get; set; } = Array.Empty<string>();
}

public record CreateListingRequest(
    Guid CategoryId,
    string Title,
    string Description,
    decimal Price,
    int StockQuantity,
    string? DeliveryInfo,
    IReadOnlyList<CreateListingAttributeRequest>? Attributes,
    IReadOnlyList<string>? Tags);

public record CreateListingAttributeRequest(
    Guid CategoryAttributeId,
    string Value);

public record UpdateListingRequest(
    Guid CategoryId,
    string Title,
    string Description,
    decimal Price,
    int StockQuantity,
    string? DeliveryInfo,
    IReadOnlyList<CreateListingAttributeRequest>? Attributes,
    IReadOnlyList<string>? Tags);

public record ListingFilterRequest(
    int Page = 1,
    int PageSize = 20,
    Guid? CategoryId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    string? Search = null,
    string? SortBy = "createdAt",
    string? SortOrder = "desc",
    string? Status = "Active");

public record UpdateListingStatusRequest(
    string Status);
