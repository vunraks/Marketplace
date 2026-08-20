using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VaultTrade.Application.Common;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Middlewares;

public class AccountRestrictionMiddleware
{
    private readonly RequestDelegate _next;

    public AccountRestrictionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        if (!ShouldCheck(context))
        {
            await _next(context);
            return;
        }

        var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId))
        {
            await _next(context);
            return;
        }

        var user = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.IsBlocked, u.BlockedUntil, u.BlockReason })
            .FirstOrDefaultAsync(context.RequestAborted);

        var isRestricted = user?.IsBlocked == true &&
            (user.BlockedUntil is null || user.BlockedUntil > DateTime.UtcNow);

        if (!isRestricted || IsAllowedWhileRestricted(context))
        {
            await _next(context);
            return;
        }

        var untilText = user!.BlockedUntil.HasValue
            ? $" до {user.BlockedUntil.Value:dd.MM.yyyy HH:mm} UTC"
            : string.Empty;
        var reasonText = string.IsNullOrWhiteSpace(user.BlockReason)
            ? string.Empty
            : $" Причина: {user.BlockReason}";

        throw new ForbiddenException($"Аккаунт ограничен{untilText}. Доступен только просмотр объявлений.{reasonText}");
    }

    private static bool ShouldCheck(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated != true)
            return false;

        if (HttpMethods.IsOptions(context.Request.Method))
            return false;

        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/api/v1/auth", StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    private static bool IsAllowedWhileRestricted(HttpContext context)
    {
        if (HttpMethods.IsHead(context.Request.Method) || HttpMethods.IsOptions(context.Request.Method))
            return true;

        if (!HttpMethods.IsGet(context.Request.Method))
            return false;

        var path = context.Request.Path.Value ?? string.Empty;
        return path.StartsWith("/api/v1/listings", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/v1/categories", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api/v1/users/me", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/v1/users/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/v1/reviews/sellers/", StringComparison.OrdinalIgnoreCase);
    }
}
