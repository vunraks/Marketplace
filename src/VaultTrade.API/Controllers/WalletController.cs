using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.Application.Common;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly AppDbContext _context;

    public WalletController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        return Ok(new WalletDto(user.VirtualBalance, "VT"));
    }

    [HttpPost("top-up")]
    public async Task<IActionResult> TopUp([FromBody] TopUpWalletRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
            throw new AppException("Amount must be positive");

        var userId = User.GetUserId();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        user.VirtualBalance += request.Amount;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new WalletDto(user.VirtualBalance, "VT"));
    }
}

public record TopUpWalletRequest(decimal Amount);
public record WalletDto(decimal Balance, string Currency);
