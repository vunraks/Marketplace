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
public class ProfilePostsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProfilePostsController(AppDbContext context) => _context = context;

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<ProfilePostDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var posts = await QueryWallPosts(userId).ToListAsync(cancellationToken);
        return Ok(posts);
    }

    [HttpGet("users/{username}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<ProfilePostDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByUsername(string username, CancellationToken cancellationToken)
    {
        var owner = await FindUserByUsernameAsync(username, cancellationToken);
        var posts = await QueryWallPosts(owner.Id).ToListAsync(cancellationToken);
        return Ok(posts);
    }

    [HttpPost("me")]
    [Authorize]
    [ProducesResponseType(typeof(ProfilePostDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateMine([FromBody] CreateProfilePostRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var post = await CreatePostAsync(userId, userId, request.Content, cancellationToken);
        return Created(string.Empty, post);
    }

    [HttpPost("users/{username}")]
    [Authorize]
    [ProducesResponseType(typeof(ProfilePostDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateOnUserWall(string username, [FromBody] CreateProfilePostRequest request, CancellationToken cancellationToken)
    {
        var owner = await FindUserByUsernameAsync(username, cancellationToken);
        var authorId = User.GetUserId();
        var post = await CreatePostAsync(owner.Id, authorId, request.Content, cancellationToken);
        return Created(string.Empty, post);
    }

    private IQueryable<ProfilePostDto> QueryWallPosts(Guid wallOwnerId) =>
        _context.ProfilePosts
            .AsNoTracking()
            .Where(p => p.UserId == wallOwnerId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProfilePostDto(
                p.Id,
                p.Content,
                p.CreatedAt,
                p.AuthorId,
                p.Author.Username));

    private async Task<User> FindUserByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        var normalized = username.Trim().ToLowerInvariant();
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == normalized && u.IsActive, cancellationToken)
            ?? throw new NotFoundException("User not found");
    }

    private async Task<ProfilePostDto> CreatePostAsync(Guid wallOwnerId, Guid authorId, string? content, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new AppException("Post content is required");

        var text = content.Trim();
        if (text.Length > 2000)
            throw new AppException("Post content is too long");

        var authorUsername = await _context.Users
            .Where(u => u.Id == authorId)
            .Select(u => u.Username)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Author not found");

        var post = new ProfilePost
        {
            UserId = wallOwnerId,
            AuthorId = authorId,
            Content = text
        };

        _context.ProfilePosts.Add(post);
        await _context.SaveChangesAsync(cancellationToken);

        return new ProfilePostDto(post.Id, post.Content, post.CreatedAt, authorId, authorUsername);
    }
}
