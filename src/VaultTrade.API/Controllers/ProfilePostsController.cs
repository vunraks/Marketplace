using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.API.Extensions;
using VaultTrade.Application.Common;
using VaultTrade.Application.DTOs.Users;
using VaultTrade.Domain.Entities;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/profile-posts")]
[Authorize]
public class ProfilePostsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProfilePostsController(AppDbContext context) => _context = context;

    [HttpGet("me")]
    [ProducesResponseType(typeof(IReadOnlyList<ProfilePostDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var posts = await _context.ProfilePosts
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProfilePostDto(p.Id, p.Content, p.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(posts);
    }

    [HttpPost("me")]
    [ProducesResponseType(typeof(ProfilePostDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateMine([FromBody] CreateProfilePostRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new AppException("Post content is required");

        if (request.Content.Length > 2000)
            throw new AppException("Post content is too long");

        var post = new ProfilePost
        {
            UserId = User.GetUserId(),
            Content = request.Content.Trim()
        };

        _context.ProfilePosts.Add(post);
        await _context.SaveChangesAsync(cancellationToken);

        return Created(string.Empty, new ProfilePostDto(post.Id, post.Content, post.CreatedAt));
    }
}
