using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultTrade.API.Extensions;
using VaultTrade.Application.DTOs.Users;
using VaultTrade.Application.Interfaces;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService) => _userService = userService;

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var profile = await _userService.GetCurrentUserAsync(User.GetUserId(), cancellationToken);
        return Ok(profile);
    }

    [HttpPut("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var profile = await _userService.UpdateProfileAsync(User.GetUserId(), request, cancellationToken);
        return Ok(profile);
    }

    [HttpPost("me/avatar")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { detail = "File is required" });

        await using var stream = file.OpenReadStream();
        var url = await _userService.UpdateAvatarAsync(User.GetUserId(), stream, file.FileName, cancellationToken);
        return Ok(new { avatarUrl = url });
    }

    [HttpGet("admin")]
    [Authorize(Policy = "RequireAdmin")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllForAdmin(CancellationToken cancellationToken)
    {
        var users = await _userService.GetAllForAdminAsync(cancellationToken);
        return Ok(users);
    }

    [HttpPut("admin/{id:guid}/roles")]
    [Authorize(Policy = "RequireAdmin")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateRoles(Guid id, [FromBody] UpdateUserRolesRequest request, CancellationToken cancellationToken)
    {
        var user = await _userService.UpdateRolesAsync(User.GetUserId(), id, request, cancellationToken);
        return Ok(user);
    }

    [HttpPost("admin/{id:guid}/balance")]
    [Authorize(Policy = "RequireAdmin")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> AdjustBalance(Guid id, [FromBody] AdjustUserBalanceRequest request, CancellationToken cancellationToken)
    {
        var user = await _userService.AdjustBalanceAsync(id, request, cancellationToken);
        return Ok(user);
    }

    [HttpPut("admin/{id:guid}/block")]
    [Authorize(Policy = "RequireAdmin")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateBlock(Guid id, [FromBody] UpdateUserBlockRequest request, CancellationToken cancellationToken)
    {
        var user = await _userService.UpdateBlockAsync(id, request, cancellationToken);
        return Ok(user);
    }

    [HttpGet("{username}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PublicUserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicProfile(string username, CancellationToken cancellationToken)
    {
        var profile = await _userService.GetPublicProfileAsync(username, cancellationToken);
        return Ok(profile);
    }

    [HttpPost("me/become-seller")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> BecomeSeller(CancellationToken cancellationToken)
    {
        await _userService.BecomeSellerAsync(User.GetUserId(), cancellationToken);
        return Ok(new { message = "Seller role granted" });
    }
}
