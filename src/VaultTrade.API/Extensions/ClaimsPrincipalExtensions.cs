using System.Security.Claims;

namespace VaultTrade.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var id = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(ClaimTypes.Name)
            ?? user.FindFirstValue("sub");

        return Guid.TryParse(id, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("User id claim is missing");
    }

    public static string? GetClientIpAddress(this HttpContext context)
    {
        return context.Connection.RemoteIpAddress?.ToString();
    }
}
