using AutoMapper;
using System.Text.Json;
using VaultTrade.Application.DTOs.Auth;
using VaultTrade.Application.DTOs.Categories;
using VaultTrade.Application.DTOs.Listings;
using VaultTrade.Application.DTOs.Users;
using VaultTrade.Domain.Entities;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // =========================
        // Users
        // =========================

        CreateMap<User, UserProfileDto>()
            .ForMember(d => d.Roles,
                o => o.MapFrom(s => s.UserRoles.Select(r => r.Role.Name).ToList()));

        CreateMap<User, UserSummaryDto>()
            .ForMember(d => d.Roles,
                o => o.MapFrom(s => s.UserRoles.Select(r => r.Role.Name).ToList()));

        CreateMap<User, PublicUserProfileDto>()
            .ForMember(d => d.AverageRating,
                o => o.MapFrom(s =>
                    s.SellerRating != null
                        ? s.SellerRating.AverageRating
                        : (decimal?)null))
            .ForMember(d => d.TotalReviews,
                o => o.MapFrom(s =>
                    s.SellerRating != null
                        ? s.SellerRating.TotalReviews
                        : 0))
            .ForMember(d => d.ActiveListingsCount,
                o => o.MapFrom(s =>
                    s.Listings.Count(l => l.Status == ListingStatus.Active)))
            .ForMember(d => d.MemberSince,
                o => o.MapFrom(s => s.CreatedAt));

        // =========================
        // Categories
        // =========================

        CreateMap<Category, CategoryDto>();

        CreateMap<Category, CategoryTreeDto>()
            .ForMember(d => d.Children,
                o => o.MapFrom(s =>
                    s.Children
                        .Where(c => c.IsActive)
                        .OrderBy(c => c.SortOrder)
                        .ToList()));

        CreateMap<CategoryAttribute, CategoryAttributeDto>()
            .ForMember(d => d.AttributeType,
                o => o.MapFrom(s => s.AttributeType.ToString()))
            .ForMember(d => d.Options,
                o => o.MapFrom(s => ParseOptions(s.OptionsJson)));

        // =========================
        // Listings
        // =========================

        CreateMap<Listing, ListingCardDto>()
            .ForMember(d => d.Status,
                o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.PrimaryImageUrl,
                o => o.MapFrom(s => GetPrimaryImageUrl(s)))
            .ForMember(d => d.CategoryName,
                o => o.MapFrom(s => s.Category.Name))
            .ForMember(d => d.SellerUsername,
                o => o.MapFrom(s => s.Seller.Username))
            .ForMember(d => d.SellerRating,
                o => o.MapFrom(s =>
                    s.Seller.SellerRating != null
                        ? s.Seller.SellerRating.AverageRating
                        : (decimal?)null));

        CreateMap<Listing, ListingDetailDto>()
            .ForMember(d => d.Status,
                o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.CategoryName,
                o => o.MapFrom(s => s.Category.Name))
            .ForMember(d => d.SellerUsername,
                o => o.MapFrom(s => s.Seller.Username))
            .ForMember(d => d.SellerRating,
                o => o.MapFrom(s =>
                    s.Seller.SellerRating != null
                        ? s.Seller.SellerRating.AverageRating
                        : (decimal?)null))
            .ForMember(d => d.Attributes,
                o => o.MapFrom(s =>
                    s.AttributeValues.Select(v => new ListingAttributeValueDto
                    {
                        Name = v.CategoryAttribute.Name,
                        Slug = v.CategoryAttribute.Slug,
                        Value = v.Value
                    }).ToList()))
            .ForMember(d => d.Tags,
                o => o.MapFrom(s =>
                    s.ListingTags.Select(t => t.Tag.Name).ToList()));

        CreateMap<ListingImage, ListingImageDto>();
    }

    private static string? GetPrimaryImageUrl(Listing listing)
    {
        var primary = listing.Images
            .OrderBy(i => i.SortOrder)
            .FirstOrDefault(i => i.IsPrimary);

        if (primary != null)
            return primary.Url;

        return listing.Images
            .OrderBy(i => i.SortOrder)
            .FirstOrDefault()?.Url;
    }

    private static IReadOnlyList<string>? ParseOptions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        return JsonSerializer.Deserialize<List<string>>(json);
    }
}