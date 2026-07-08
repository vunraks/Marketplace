using Microsoft.EntityFrameworkCore;
using VaultTrade.Application.Interfaces;
using VaultTrade.Domain.Entities;
using VaultTrade.Domain.Enums;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context) => _context = context;

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.Listings)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.SellerRating)
            .Include(u => u.Listings)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.SellerRating)
            .Include(u => u.Listings)
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
    }

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
        => _context.Users.AnyAsync(u => u.Email == email, cancellationToken);

    public Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default)
        => _context.Users.AnyAsync(u => u.Username == username, cancellationToken);

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
        => await _context.Users.AddAsync(user, cancellationToken);

    public void Update(User user) => _context.Users.Update(user);
}

public class RoleRepository : IRoleRepository
{
    private readonly AppDbContext _context;

    public RoleRepository(AppDbContext context) => _context = context;

    public Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
        => _context.Roles.FirstOrDefaultAsync(r => r.Name == name, cancellationToken);

    public async Task<IReadOnlyList<Role>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _context.Roles.OrderBy(r => r.Name).ToListAsync(cancellationToken);
}

public class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _context;

    public CategoryRepository(AppDbContext context) => _context = context;

    public async Task<IReadOnlyList<Category>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default)
    {
        var query = _context.Categories
            .Include(c => c.Children.Where(ch => includeInactive || ch.IsActive))
            .Include(c => c.Attributes)
            .AsQueryable();

        if (!includeInactive)
            query = query.Where(c => c.IsActive);

        return await query.OrderBy(c => c.SortOrder).ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .Include(c => c.Attributes.OrderBy(a => a.SortOrder))
            .FirstOrDefaultAsync(c => c.Slug == slug && c.IsActive, cancellationToken);
    }

    public Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _context.Categories.Include(c => c.Attributes).FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
}

public class TagRepository : ITagRepository
{
    private readonly AppDbContext _context;

    public TagRepository(AppDbContext context) => _context = context;

    public async Task<IReadOnlyList<Tag>> GetByNamesOrSlugsAsync(
        IReadOnlyCollection<string> names,
        IReadOnlyCollection<string> slugs,
        CancellationToken cancellationToken = default)
    {
        if (names.Count == 0 && slugs.Count == 0)
            return Array.Empty<Tag>();

        var normalizedNames = names.Select(n => n.ToLower()).ToArray();
        var normalizedSlugs = slugs.Select(s => s.ToLower()).ToArray();

        return await _context.Tags
            .Where(t => normalizedNames.Contains(t.Name.ToLower()) || normalizedSlugs.Contains(t.Slug.ToLower()))
            .ToListAsync(cancellationToken);
    }
}

public class ListingRepository : IListingRepository
{
    private readonly AppDbContext _context;

    public ListingRepository(AppDbContext context) => _context = context;

    public async Task<(IReadOnlyList<Listing> Items, int TotalCount)> GetFilteredAsync(
        Guid? categoryId,
        decimal? minPrice,
        decimal? maxPrice,
        string? search,
        string? status,
        string sortBy,
        string sortOrder,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Listings
            .Include(l => l.Category)
            .Include(l => l.Seller).ThenInclude(s => s.SellerRating)
            .Include(l => l.Images)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(l => l.CategoryId == categoryId.Value);

        if (minPrice.HasValue)
            query = query.Where(l => l.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(l => l.Price <= maxPrice.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ListingStatus>(status, true, out var listingStatus))
            query = query.Where(l => l.Status == listingStatus);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(l =>
                l.Title.ToLower().Contains(term) ||
                l.Description.ToLower().Contains(term));
        }

        query = ApplySorting(query, sortBy, sortOrder);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<Listing?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Listings
            .Include(l => l.Category)
            .Include(l => l.Seller).ThenInclude(s => s.SellerRating)
            .Include(l => l.Images.OrderBy(i => i.SortOrder))
            .Include(l => l.AttributeValues).ThenInclude(v => v.CategoryAttribute)
            .Include(l => l.ListingTags).ThenInclude(lt => lt.Tag)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }

    public async Task<(IReadOnlyList<Listing> Items, int TotalCount)> GetBySellerAsync(
        Guid sellerId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Listings
            .Include(l => l.Category)
            .Include(l => l.Seller).ThenInclude(s => s.SellerRating)
            .Include(l => l.Images)
            .Where(l => l.SellerId == sellerId)
            .OrderByDescending(l => l.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task AddAsync(Listing listing, CancellationToken cancellationToken = default)
        => await _context.Listings.AddAsync(listing, cancellationToken);

    public void Update(Listing listing) => _context.Listings.Update(listing);

    public void Remove(Listing listing) => _context.Listings.Remove(listing);

    private static IQueryable<Listing> ApplySorting(IQueryable<Listing> query, string sortBy, string sortOrder)
    {
        var desc = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase);

        return sortBy.ToLowerInvariant() switch
        {
            "price" => desc ? query.OrderByDescending(l => l.Price) : query.OrderBy(l => l.Price),
            "title" => desc ? query.OrderByDescending(l => l.Title) : query.OrderBy(l => l.Title),
            _ => desc ? query.OrderByDescending(l => l.CreatedAt) : query.OrderBy(l => l.CreatedAt)
        };
    }
}

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _context;

    public RefreshTokenRepository(AppDbContext context) => _context = context;

    public Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken = default)
        => _context.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

    public async Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default)
        => await _context.RefreshTokens.AddAsync(token, cancellationToken);

    public void Update(RefreshToken token) => _context.RefreshTokens.Update(token);

    public async Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
            token.RevokedAt = DateTime.UtcNow;
    }
}

public class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly AppDbContext _context;

    public PasswordResetTokenRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(PasswordResetToken token, CancellationToken cancellationToken = default)
        => await _context.PasswordResetTokens.AddAsync(token, cancellationToken);

    public Task<PasswordResetToken?> GetValidByHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        return _context.PasswordResetTokens.FirstOrDefaultAsync(
            t => t.TokenHash == tokenHash && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow,
            cancellationToken);
    }

    public void Update(PasswordResetToken token) => _context.PasswordResetTokens.Update(token);
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(
        AppDbContext context,
        IUserRepository users,
        IRoleRepository roles,
        ICategoryRepository categories,
        ITagRepository tags,
        IListingRepository listings,
        IRefreshTokenRepository refreshTokens,
        IPasswordResetTokenRepository passwordResetTokens)
    {
        _context = context;
        Users = users;
        Roles = roles;
        Categories = categories;
        Tags = tags;
        Listings = listings;
        RefreshTokens = refreshTokens;
        PasswordResetTokens = passwordResetTokens;
    }

    public IUserRepository Users { get; }
    public IRoleRepository Roles { get; }
    public ICategoryRepository Categories { get; }
    public ITagRepository Tags { get; }
    public IListingRepository Listings { get; }
    public IRefreshTokenRepository RefreshTokens { get; }
    public IPasswordResetTokenRepository PasswordResetTokens { get; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
