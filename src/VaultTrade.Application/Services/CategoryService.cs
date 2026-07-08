using AutoMapper;
using VaultTrade.Application.Common;
using VaultTrade.Application.DTOs.Categories;
using VaultTrade.Application.Interfaces;

namespace VaultTrade.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CategoryService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<CategoryTreeDto>> GetTreeAsync(
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var categories = await _unitOfWork.Categories.GetAllAsync(includeInactive, cancellationToken);

        var roots = categories
            .Where(c => c.ParentId is null)
            .OrderBy(c => c.SortOrder)
            .ToList();

        return _mapper.Map<IReadOnlyList<CategoryTreeDto>>(roots);
    }

    public async Task<CategoryDetailDto> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var category = await _unitOfWork.Categories.GetBySlugAsync(slug, cancellationToken)
            ?? throw new NotFoundException("Category not found");

        return new CategoryDetailDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            Attributes = category.Attributes
                .OrderBy(a => a.SortOrder)
                .Select(a => _mapper.Map<CategoryAttributeDto>(a))
                .ToList()
        };
    }
}