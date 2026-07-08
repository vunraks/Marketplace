using VaultTrade.Application.Common;
using VaultTrade.Application.DTOs.Auth;
using VaultTrade.Application.DTOs.Categories;
using VaultTrade.Application.DTOs.Listings;
using VaultTrade.Application.DTOs.Users;

namespace VaultTrade.Application.Interfaces;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<AuthResponse> ExternalLoginAsync(string provider, ExternalLoginRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task LogoutAsync(Guid userId, RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
}

public interface IExternalAuthTokenValidator
{
    Task<ExternalUserInfo> ValidateGoogleIdTokenAsync(string idToken, CancellationToken cancellationToken = default);
}

public interface IUserService
{
    Task<UserProfileDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task<string> UpdateAvatarAsync(Guid userId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task<PublicUserProfileDto> GetPublicProfileAsync(string username, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AdminUserDto>> GetAllForAdminAsync(CancellationToken cancellationToken = default);
    Task<AdminUserDto> UpdateRolesAsync(Guid adminId, Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken = default);
    Task BecomeSellerAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryTreeDto>> GetTreeAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<CategoryDetailDto> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
}

public interface IListingService
{
    Task<PagedResult<ListingCardDto>> GetListingsAsync(ListingFilterRequest filter, CancellationToken cancellationToken = default);
    Task<ListingDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ListingDetailDto> CreateAsync(Guid sellerId, CreateListingRequest request, CancellationToken cancellationToken = default);
    Task<ListingDetailDto> UpdateAsync(Guid sellerId, Guid listingId, UpdateListingRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid listingId, CancellationToken cancellationToken = default);
    Task<ListingDetailDto> UpdateStatusAsync(Guid userId, Guid listingId, string status, CancellationToken cancellationToken = default);
    Task<PagedResult<ListingCardDto>> GetMyListingsAsync(Guid sellerId, int page, int pageSize, CancellationToken cancellationToken = default);
}

public interface IFileStorageService
{
    Task<string> SaveListingImageAsync(Guid listingId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task<string> SaveAvatarAsync(Guid userId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    void DeleteFile(string relativePath);
}

public interface ITokenService
{
    string GenerateAccessToken(Guid userId, string email, string username, IEnumerable<string> roles);
    string GenerateRefreshToken();
    string HashToken(string token);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}
