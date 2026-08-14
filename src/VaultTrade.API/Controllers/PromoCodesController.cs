using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.API.Services;
using VaultTrade.Application.Common;
using VaultTrade.Domain.Constants;
using VaultTrade.Domain.Entities;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/promocodes")]
[Authorize]
public class PromoCodesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly RealtimeNotifier _realtime;

    public PromoCodesController(AppDbContext context, RealtimeNotifier realtime)
    {
        _context = context;
        _realtime = realtime;
    }

    [HttpGet]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var items = await _context.PromoCodes
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new PromoCodeDto(
                x.Id,
                x.Code,
                x.Description,
                x.BonusAmount,
                x.MaxRedemptions,
                x.RedeemedCount,
                x.IsActive,
                x.ExpiresAt,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> Create([FromBody] CreatePromoCodeRequest request, CancellationToken cancellationToken)
    {
        var code = NormalizeCode(request.Code);
        if (code.Length < 3)
            throw new AppException("Promo code must contain at least 3 characters");

        if (request.BonusAmount <= 0)
            throw new AppException("Bonus amount must be greater than zero");

        if (request.MaxRedemptions is <= 0)
            throw new AppException("Max redemptions must be greater than zero");

        var exists = await _context.PromoCodes.AnyAsync(x => x.Code == code, cancellationToken);
        if (exists)
            throw new AppException("Promo code already exists");

        var promoCode = new PromoCode
        {
            Code = code,
            Description = request.Description?.Trim(),
            BonusAmount = request.BonusAmount,
            MaxRedemptions = request.MaxRedemptions,
            ExpiresAt = request.ExpiresAt,
            CreatedById = User.GetUserId()
        };

        _context.PromoCodes.Add(promoCode);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetAll), new { id = promoCode.Id }, ToDto(promoCode));
    }

    [HttpPatch("{id:guid}/disable")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> Disable(Guid id, CancellationToken cancellationToken)
    {
        var promoCode = await _context.PromoCodes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new NotFoundException("Promo code not found");

        promoCode.IsActive = false;
        promoCode.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(promoCode));
    }

    [HttpPost("redeem")]
    public async Task<IActionResult> Redeem([FromBody] RedeemPromoCodeRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var code = NormalizeCode(request.Code);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var promoCode = await _context.PromoCodes
            .FirstOrDefaultAsync(x => x.Code == code, cancellationToken)
            ?? throw new NotFoundException("Promo code not found");

        if (!promoCode.IsActive)
            throw new AppException("Promo code is disabled");

        if (promoCode.ExpiresAt is not null && promoCode.ExpiresAt <= DateTime.UtcNow)
            throw new AppException("Promo code has expired");

        if (promoCode.MaxRedemptions is not null && promoCode.RedeemedCount >= promoCode.MaxRedemptions)
            throw new AppException("Promo code usage limit has been reached");

        var alreadyRedeemed = await _context.PromoCodeRedemptions
            .AnyAsync(x => x.PromoCodeId == promoCode.Id && x.UserId == userId, cancellationToken);

        if (alreadyRedeemed)
            throw new AppException("You have already redeemed this promo code");

        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        user.VirtualBalance += promoCode.BonusAmount;
        user.UpdatedAt = DateTime.UtcNow;
        promoCode.RedeemedCount++;
        promoCode.UpdatedAt = DateTime.UtcNow;

        _context.PromoCodeRedemptions.Add(new PromoCodeRedemption
        {
            PromoCodeId = promoCode.Id,
            UserId = userId,
            BonusAmount = promoCode.BonusAmount
        });

        var notification = new Notification
        {
            UserId = userId,
            Type = "promo_bonus",
            Title = "Промокод активирован",
            Body = $"На баланс начислено {promoCode.BonusAmount:N0} VT.",
            DataJson = $$"""{"promoCodeId":"{{promoCode.Id}}","code":"{{promoCode.Code}}","bonusAmount":{{promoCode.BonusAmount}}}"""
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await _realtime.SendNotificationAsync(notification, cancellationToken);

        return Ok(new RedeemPromoCodeResult(promoCode.Code, promoCode.BonusAmount, user.VirtualBalance));
    }

    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();

    private static PromoCodeDto ToDto(PromoCode promoCode) => new(
        promoCode.Id,
        promoCode.Code,
        promoCode.Description,
        promoCode.BonusAmount,
        promoCode.MaxRedemptions,
        promoCode.RedeemedCount,
        promoCode.IsActive,
        promoCode.ExpiresAt,
        promoCode.CreatedAt);
}

public record CreatePromoCodeRequest(string Code, decimal BonusAmount, int? MaxRedemptions, DateTime? ExpiresAt, string? Description);
public record RedeemPromoCodeRequest(string Code);
public record RedeemPromoCodeResult(string Code, decimal BonusAmount, decimal Balance);
public record PromoCodeDto(Guid Id, string Code, string? Description, decimal BonusAmount, int? MaxRedemptions, int RedeemedCount, bool IsActive, DateTime? ExpiresAt, DateTime CreatedAt);
