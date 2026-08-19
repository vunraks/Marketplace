using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VaultTrade.Application.Common;
using VaultTrade.Application.DTOs.Auth;
using VaultTrade.Application.Interfaces;
using VaultTrade.Infrastructure.Configurations;

namespace VaultTrade.Infrastructure.Authentication;

public class GoogleExternalAuthTokenValidator : IExternalAuthTokenValidator
{
    private const string GoogleKeysUrl = "https://www.googleapis.com/oauth2/v3/certs";
    private static readonly string[] ValidIssuers = ["https://accounts.google.com", "accounts.google.com"];
    private static readonly TimeSpan TelegramLoginLifetime = TimeSpan.FromDays(1);

    private readonly HttpClient _httpClient;
    private readonly ExternalAuthSettings _settings;

    public GoogleExternalAuthTokenValidator(HttpClient httpClient, IOptions<ExternalAuthSettings> settings)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
    }

    public async Task<ExternalUserInfo> ValidateGoogleIdTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.Google.ClientId))
            throw new AppException("Google ClientId is not configured", 500);

        try
        {
            var jwksJson = await _httpClient.GetStringAsync(GoogleKeysUrl, cancellationToken);
            var keys = new JsonWebKeySet(jwksJson).Keys;
            var handler = new JwtSecurityTokenHandler
            {
                MapInboundClaims = false
            };
            var principal = handler.ValidateToken(idToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuers = ValidIssuers,
                ValidateAudience = true,
                ValidAudience = _settings.Google.ClientId,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = keys,
                ClockSkew = TimeSpan.FromMinutes(2)
            }, out _);

            var providerUserId = GetRequiredClaim(principal, JwtRegisteredClaimNames.Sub);
            var email = GetRequiredClaim(principal, JwtRegisteredClaimNames.Email);
            var emailVerified = string.Equals(
                principal.FindFirstValue("email_verified"),
                "true",
                StringComparison.OrdinalIgnoreCase);

            return new ExternalUserInfo(
                providerUserId,
                email,
                principal.FindFirstValue("name"),
                principal.FindFirstValue("picture"),
                emailVerified);
        }
        catch (SecurityTokenException ex)
        {
            throw new UnauthorizedAppException($"Invalid Google token: {ex.Message}");
        }
        catch (ArgumentException ex)
        {
            throw new UnauthorizedAppException($"Invalid Google token: {ex.Message}");
        }
    }

    public Task<ExternalUserInfo> ValidateTelegramLoginAsync(ExternalLoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.Telegram.BotToken))
            throw new AppException("Telegram BotToken is not configured", 500);

        if (request.Id is null || request.AuthDate is null || string.IsNullOrWhiteSpace(request.Hash))
            throw new UnauthorizedAppException("Telegram auth payload is incomplete");

        var authDate = DateTimeOffset.FromUnixTimeSeconds(request.AuthDate.Value);
        if (DateTimeOffset.UtcNow - authDate > TelegramLoginLifetime)
            throw new UnauthorizedAppException("Telegram auth payload has expired");

        var values = new SortedDictionary<string, string>
        {
            ["auth_date"] = request.AuthDate.Value.ToString(),
            ["id"] = request.Id.Value.ToString()
        };

        AddTelegramValue(values, "first_name", request.FirstName);
        AddTelegramValue(values, "last_name", request.LastName);
        AddTelegramValue(values, "photo_url", request.PhotoUrl);
        AddTelegramValue(values, "username", request.Username);

        var dataCheckString = string.Join('\n', values.Select(kvp => $"{kvp.Key}={kvp.Value}"));
        var secretKey = SHA256.HashData(Encoding.UTF8.GetBytes(_settings.Telegram.BotToken));
        var computedHashBytes = HMACSHA256.HashData(secretKey, Encoding.UTF8.GetBytes(dataCheckString));
        var computedHash = Convert.ToHexString(computedHashBytes).ToLowerInvariant();

        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(computedHash),
                Encoding.ASCII.GetBytes(request.Hash.ToLowerInvariant())))
            throw new UnauthorizedAppException("Invalid Telegram auth signature");

        var providerUserId = request.Id.Value.ToString();
        var email = $"telegram-{providerUserId}@telegram.vaulttrade.local";
        var displayName = GetTelegramDisplayName(request, providerUserId);

        return Task.FromResult(new ExternalUserInfo(
            providerUserId,
            email,
            displayName,
            request.PhotoUrl,
            true));
    }

    private static string GetRequiredClaim(ClaimsPrincipal principal, string claimType)
    {
        return principal.FindFirstValue(claimType)
            ?? throw new UnauthorizedAppException($"Google token does not contain {claimType}");
    }

    private static void AddTelegramValue(IDictionary<string, string> values, string key, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            values[key] = value;
    }

    private static string GetTelegramDisplayName(ExternalLoginRequest request, string providerUserId)
    {
        if (!string.IsNullOrWhiteSpace(request.Username))
            return request.Username;

        var fullName = string.Join(' ', new[] { request.FirstName, request.LastName }
            .Where(part => !string.IsNullOrWhiteSpace(part)));

        return string.IsNullOrWhiteSpace(fullName) ? $"telegram{providerUserId}" : fullName;
    }
}
