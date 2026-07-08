using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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

    private static string GetRequiredClaim(ClaimsPrincipal principal, string claimType)
    {
        return principal.FindFirstValue(claimType)
            ?? throw new UnauthorizedAppException($"Google token does not contain {claimType}");
    }
}
