using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultTrade.API.Extensions;
using VaultTrade.Application.DTOs.Listings;
using VaultTrade.Application.Interfaces;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/listings")]
public class ListingsController : ControllerBase
{
    private readonly IListingService _listingService;
    private readonly IFileStorageService _fileStorage;

    public ListingsController(IListingService listingService, IFileStorageService fileStorage)
    {
        _listingService = listingService;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetListings([FromQuery] ListingFilterRequest filter, CancellationToken cancellationToken)
    {
        var result = await _listingService.GetListingsAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] ListingFilterRequest filter, CancellationToken cancellationToken)
    {
        var result = await _listingService.GetListingsAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ListingDetailDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var listing = await _listingService.GetByIdAsync(id, cancellationToken);
        return Ok(listing);
    }

    [HttpGet("my")]
    [Authorize(Policy = "RequireSeller")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyListings([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _listingService.GetMyListingsAsync(User.GetUserId(), page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "RequireSeller")]
    [ProducesResponseType(typeof(ListingDetailDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateListingRequest request, CancellationToken cancellationToken)
    {
        await ValidateAsync(request, cancellationToken);
        var listing = await _listingService.CreateAsync(User.GetUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = listing.Id }, listing);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireSeller")]
    [ProducesResponseType(typeof(ListingDetailDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateListingRequest request, CancellationToken cancellationToken)
    {
        await ValidateAsync(request, cancellationToken);
        var listing = await _listingService.UpdateAsync(User.GetUserId(), id, request, cancellationToken);
        return Ok(listing);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireSeller")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _listingService.DeleteAsync(User.GetUserId(), id, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize]
    [ProducesResponseType(typeof(ListingDetailDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateListingStatusRequest request, CancellationToken cancellationToken)
    {
        var listing = await _listingService.UpdateStatusAsync(User.GetUserId(), id, request.Status, cancellationToken);
        return Ok(listing);
    }

    [HttpPost("{id:guid}/images")]
    [Authorize(Policy = "RequireSeller")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> UploadImages(Guid id, [FromForm] List<IFormFile> files, CancellationToken cancellationToken)
    {
        if (files is null || files.Count == 0)
            return BadRequest(new { detail = "At least one file is required" });

        var urls = new List<string>();
        foreach (var file in files)
        {
            await using var stream = file.OpenReadStream();
            var url = await _fileStorage.SaveListingImageAsync(id, stream, file.FileName, cancellationToken);
            urls.Add(url);
        }

        return Created(string.Empty, new { urls });
    }

    private async Task ValidateAsync<T>(T request, CancellationToken cancellationToken)
    {
        var validator = HttpContext.RequestServices.GetRequiredService<IValidator<T>>();
        await validator.ValidateAndThrowAsync(request, cancellationToken);
    }
}
