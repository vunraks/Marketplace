using VaultTrade.Domain.Entities;

namespace VaultTrade.Application.Interfaces;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    IRoleRepository Roles { get; }
    ICategoryRepository Categories { get; }
    ITagRepository Tags { get; }
    IListingRepository Listings { get; }
    IRefreshTokenRepository RefreshTokens { get; }
    IPasswordResetTokenRepository PasswordResetTokens { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IUserRepository
{
    Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    void Update(User user);
}

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Role>> GetAllAsync(CancellationToken cancellationToken = default);
}

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default);
    Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface ITagRepository
{
    Task<IReadOnlyList<Tag>> GetByNamesOrSlugsAsync(
        IReadOnlyCollection<string> names,
        IReadOnlyCollection<string> slugs,
        CancellationToken cancellationToken = default);
}

public interface IListingRepository
{
    Task<(IReadOnlyList<Listing> Items, int TotalCount)> GetFilteredAsync(
        Guid? categoryId,
        decimal? minPrice,
        decimal? maxPrice,
        string? search,
        string? status,
        string sortBy,
        string sortOrder,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<Listing?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ListingImageUploadInfo?> GetImageUploadInfoAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Listing> Items, int TotalCount)> GetBySellerAsync(Guid sellerId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task AddAsync(Listing listing, CancellationToken cancellationToken = default);
    Task AddImagesAsync(IReadOnlyList<ListingImage> images, CancellationToken cancellationToken = default);
    void Update(Listing listing);
    void Remove(Listing listing);
}

public record ListingImageUploadInfo(Guid Id, Guid SellerId, string Title, int NextSortOrder, bool ShouldSetPrimary);

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default);
    void Update(RefreshToken token);
    Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface IPasswordResetTokenRepository
{
    Task AddAsync(PasswordResetToken token, CancellationToken cancellationToken = default);
    Task<PasswordResetToken?> GetValidByHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    void Update(PasswordResetToken token);
}
