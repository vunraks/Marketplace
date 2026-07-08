using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaultTrade.Application.DTOs.Categories;
using VaultTrade.Application.Interfaces;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService) => _categoryService = categoryService;

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<CategoryTreeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTree([FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var tree = await _categoryService.GetTreeAsync(includeInactive, cancellationToken);
        return Ok(tree);
    }

    [HttpGet("{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CategoryDetailDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var category = await _categoryService.GetBySlugAsync(slug, cancellationToken);
        return Ok(category);
    }
}
