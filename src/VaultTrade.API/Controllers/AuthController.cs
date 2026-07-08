using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultTrade.API.Extensions;
using VaultTrade.Application.DTOs.Auth;
using VaultTrade.Application.Interfaces;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        await ValidateAsync(request, cancellationToken);
        var result = await _authService.RegisterAsync(request, HttpContext.GetClientIpAddress(), cancellationToken);
        return Created(string.Empty, result);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        await ValidateAsync(request, cancellationToken);
        var result = await _authService.LoginAsync(request, HttpContext.GetClientIpAddress(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("external/{provider}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExternalLogin(string provider, [FromBody] ExternalLoginRequest request, CancellationToken cancellationToken)
    {
        var normalizedProvider = provider.Trim().ToLowerInvariant();
        if (normalizedProvider != "google")
            return NotFound(new { detail = "External provider is not supported" });

        var result = await _authService.ExternalLoginAsync(normalizedProvider, request, HttpContext.GetClientIpAddress(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(request, HttpContext.GetClientIpAddress(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(User.GetUserId(), request, cancellationToken);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        await _authService.ForgotPasswordAsync(request, cancellationToken);
        return Ok(new { message = "If the email exists, a reset link has been sent" });
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        await ValidateAsync(request, cancellationToken);
        await _authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(new { message = "Password has been reset successfully" });
    }

    private async Task ValidateAsync<T>(T request, CancellationToken cancellationToken)
    {
        var validator = HttpContext.RequestServices.GetRequiredService<IValidator<T>>();
        await validator.ValidateAndThrowAsync(request, cancellationToken);
    }
}
