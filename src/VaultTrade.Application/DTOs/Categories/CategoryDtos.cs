namespace VaultTrade.Application.DTOs.Categories;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public class CategoryTreeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int SortOrder { get; set; }
    public IReadOnlyList<CategoryTreeDto> Children { get; set; } = Array.Empty<CategoryTreeDto>();
}

public class CategoryAttributeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string AttributeType { get; set; } = string.Empty;
    public IReadOnlyList<string>? Options { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
}

public class CategoryDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IReadOnlyList<CategoryAttributeDto> Attributes { get; set; } = Array.Empty<CategoryAttributeDto>();
}

public record CreateCategoryRequest(
    string Name,
    string Slug,
    string? Description,
    Guid? ParentId,
    int SortOrder);

public record UpdateCategoryRequest(
    string Name,
    string Slug,
    string? Description,
    Guid? ParentId,
    int SortOrder,
    bool IsActive);