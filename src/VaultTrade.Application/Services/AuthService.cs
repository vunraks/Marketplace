using AutoMapper;
using VaultTrade.Application.Common;
using VaultTrade.Application.DTOs.Auth;
using VaultTrade.Application.Helpers;
using VaultTrade.Application.Interfaces;
using VaultTrade.Domain.Constants;
using VaultTrade.Domain.Entities;

namespace VaultTrade.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IExternalAuthTokenValidator _externalAuthTokenValidator;
    private readonly IMapper _mapper;

    public AuthService(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IExternalAuthTokenValidator externalAuthTokenValidator,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _externalAuthTokenValidator = externalAuthTokenValidator;
        _mapper = mapper;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.Users.EmailExistsAsync(request.Email, cancellationToken))
            throw new ConflictException("Email is already registered");

        if (await _unitOfWork.Users.UsernameExistsAsync(request.Username, cancellationToken))
            throw new ConflictException("Username is already taken");

        var userRole = await _unitOfWork.Roles.GetByNameAsync(RoleNames.User, cancellationToken)
            ?? throw new AppException("Default role is not configured", 500);

        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            Username = request.Username.ToLowerInvariant(),
            PasswordHash = _passwordHasher.Hash(request.Password)
        };

        user.UserRoles.Add(new UserRole { RoleId = userRole.Id, UserId = user.Id });

        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new RegisterResponse(user.Id, user.Email, user.Username, "Registration successful");
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email.ToLowerInvariant(), cancellationToken)
            ?? throw new UnauthorizedAppException("Invalid email or password");

        if (IsAccessBlocked(user) || !user.IsActive)
            throw new ForbiddenException("Account is blocked or inactive");

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAppException("Invalid email or password");

        user.LastLoginAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);

        return await CreateAuthResponseAsync(user, ipAddress, cancellationToken);
    }

    public async Task<AuthResponse> ExternalLoginAsync(string provider, ExternalLoginRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
            throw new UnauthorizedAppException("External token is required");

        var normalizedProvider = provider.Trim().ToLowerInvariant();
        if (normalizedProvider != "google")
            throw new AppException("External provider is not supported", 404);

        var externalUser = await _externalAuthTokenValidator.ValidateGoogleIdTokenAsync(request.IdToken, cancellationToken);
        if (!externalUser.EmailVerified)
            throw new UnauthorizedAppException("Google email is not verified");

        var email = externalUser.Email.ToLowerInvariant();
        var user = await _unitOfWork.Users.GetByEmailAsync(email, cancellationToken);
        var isNewUser = user is null;

        if (user is null)
        {
            var userRole = await _unitOfWork.Roles.GetByNameAsync(RoleNames.User, cancellationToken)
                ?? throw new AppException("Default role is not configured", 500);

            user = new User
            {
                Email = email,
                Username = await GenerateExternalUsernameAsync(externalUser, cancellationToken),
                PasswordHash = _passwordHasher.Hash($"google:{externalUser.ProviderUserId}:{Guid.NewGuid():N}"),
                IsEmailVerified = true,
                AvatarUrl = externalUser.PictureUrl
            };

            user.UserRoles.Add(new UserRole { RoleId = userRole.Id, UserId = user.Id, Role = userRole });
            await _unitOfWork.Users.AddAsync(user, cancellationToken);
        }

        if (IsAccessBlocked(user) || !user.IsActive)
            throw new ForbiddenException("Account is blocked or inactive");

        user.LastLoginAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        if (isNewUser)
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        else
            _unitOfWork.Users.Update(user);

        return await CreateAuthResponseAsync(user, ipAddress, cancellationToken);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenService.HashToken(request.RefreshToken);
        var storedToken = await _unitOfWork.RefreshTokens.GetByHashAsync(tokenHash, cancellationToken)
            ?? throw new UnauthorizedAppException("Invalid refresh token");

        if (!storedToken.IsActive)
            throw new UnauthorizedAppException("Refresh token expired or revoked");

        var user = await _unitOfWork.Users.GetByIdAsync(storedToken.UserId, cancellationToken)
            ?? throw new UnauthorizedAppException("User not found");

        storedToken.RevokedAt = DateTime.UtcNow;
        _unitOfWork.RefreshTokens.Update(storedToken);

        return await CreateAuthResponseAsync(user, ipAddress, cancellationToken, storedToken.Id);
    }

    public async Task LogoutAsync(Guid userId, RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenService.HashToken(request.RefreshToken);
        var storedToken = await _unitOfWork.RefreshTokens.GetByHashAsync(tokenHash, cancellationToken);

        if (storedToken is { UserId: var id } && id == userId)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            _unitOfWork.RefreshTokens.Update(storedToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email.ToLowerInvariant(), cancellationToken);
        if (user is null) return;

        var rawToken = _tokenService.GenerateRefreshToken();
        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = _tokenService.HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        await _unitOfWork.PasswordResetTokens.AddAsync(resetToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // TODO: integrate email service — for now token is logged in development
        Console.WriteLine($"[DEV] Password reset token for {user.Email}: {rawToken}");
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenService.HashToken(request.Token);
        var resetToken = await _unitOfWork.PasswordResetTokens.GetValidByHashAsync(tokenHash, cancellationToken)
            ?? throw new AppException("Invalid or expired reset token");

        var user = await _unitOfWork.Users.GetByIdAsync(resetToken.UserId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);

        resetToken.UsedAt = DateTime.UtcNow;
        _unitOfWork.PasswordResetTokens.Update(resetToken);

        await _unitOfWork.RefreshTokens.RevokeAllForUserAsync(user.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(
        User user,
        string? ipAddress,
        CancellationToken cancellationToken,
        Guid? replacedTokenId = null)
    {
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email, user.Username, roles);

        var rawRefresh = _tokenService.GenerateRefreshToken();
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _tokenService.HashToken(rawRefresh),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = ipAddress,
            ReplacedByTokenId = replacedTokenId
        };

        await _unitOfWork.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            accessToken,
            rawRefresh,
            900,
            _mapper.Map<UserSummaryDto>(user));
    }

    private static bool IsAccessBlocked(User user)
    {
        return user.IsBlocked && (user.BlockedUntil is null || user.BlockedUntil > DateTime.UtcNow);
    }

    private async Task<string> GenerateExternalUsernameAsync(ExternalUserInfo externalUser, CancellationToken cancellationToken)
    {
        var source = !string.IsNullOrWhiteSpace(externalUser.Name)
            ? externalUser.Name
            : externalUser.Email.Split('@')[0];

        var baseUsername = SlugHelper.GenerateSlug(source).Replace("-", string.Empty);
        if (string.IsNullOrWhiteSpace(baseUsername))
            baseUsername = $"google{externalUser.ProviderUserId[..Math.Min(8, externalUser.ProviderUserId.Length)]}";

        baseUsername = baseUsername[..Math.Min(baseUsername.Length, 40)];
        var username = baseUsername;
        var attempts = 0;

        while (await _unitOfWork.Users.UsernameExistsAsync(username, cancellationToken))
        {
            attempts++;
            var suffix = attempts < 10
                ? attempts.ToString()
                : Guid.NewGuid().ToString("N")[..6];
            username = $"{baseUsername[..Math.Min(baseUsername.Length, 50 - suffix.Length)]}{suffix}";
        }

        return username;
    }
}
