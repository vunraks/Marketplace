namespace VaultTrade.Application.DTOs.Users;

public class UserProfileDto
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Bio { get; set; }

    public string? Phone { get; set; }

    public bool IsEmailVerified { get; set; }

    public decimal VirtualBalance { get; set; }

    public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();

    public DateTime CreatedAt { get; set; }
}

public class PublicUserProfileDto
{
    public Guid Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public string? Bio { get; set; }

    public decimal? AverageRating { get; set; }

    public int TotalReviews { get; set; }

    public int ActiveListingsCount { get; set; }

    public DateTime MemberSince { get; set; }
}

public class AdminUserDto
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public bool IsBlocked { get; set; }

    public bool IsEmailVerified { get; set; }

    public decimal VirtualBalance { get; set; }

    public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();

    public int ListingsCount { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime CreatedAt { get; set; }
}

public record UpdateUserRolesRequest(IReadOnlyList<string> Roles);

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? Bio { get; set; }

    public string? Phone { get; set; }
}
