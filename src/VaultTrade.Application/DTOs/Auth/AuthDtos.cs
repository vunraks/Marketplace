namespace VaultTrade.Application.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string Username,
    string Password,
    string ConfirmPassword);

public record LoginRequest(
    string Email,
    string Password);

public record RefreshTokenRequest(
    string RefreshToken);

public record ExternalLoginRequest(
    string IdToken);

public record ForgotPasswordRequest(
    string Email);

public record ResetPasswordRequest(
    string Token,
    string NewPassword,
    string ConfirmPassword);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserSummaryDto User);

public class UserSummaryDto
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public decimal VirtualBalance { get; set; }

    public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();
}

public record RegisterResponse(
    Guid UserId,
    string Email,
    string Username,
    string Message);

public record ExternalUserInfo(
    string ProviderUserId,
    string Email,
    string? Name,
    string? PictureUrl,
    bool EmailVerified);
