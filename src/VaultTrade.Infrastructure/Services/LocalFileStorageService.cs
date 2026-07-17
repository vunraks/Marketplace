using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using VaultTrade.Application.Common;
using VaultTrade.Application.Interfaces;
using VaultTrade.Infrastructure.Configurations;

namespace VaultTrade.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly StorageSettings _settings;
    private readonly string _rootPath;

    public LocalFileStorageService(IOptions<StorageSettings> settings, IWebHostEnvironment environment)
    {
        _settings = settings.Value;
        _rootPath = Path.Combine(environment.ContentRootPath, _settings.UploadPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveListingImageAsync(Guid listingId, Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        ValidateFile(fileName, fileStream, out var extension);
        var folder = Path.Combine(_rootPath, "listings", listingId.ToString());
        Directory.CreateDirectory(folder);

        var safeName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(folder, safeName);

        await using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs, cancellationToken);

        return $"/{_settings.UploadPath}/listings/{listingId}/{safeName}".Replace('\\', '/');
    }

    public async Task<string> SaveAvatarAsync(Guid userId, Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        ValidateFile(fileName, fileStream, out var extension);
        var folder = Path.Combine(_rootPath, "avatars", userId.ToString());
        Directory.CreateDirectory(folder);

        var safeName = $"avatar{extension}";
        var fullPath = Path.Combine(folder, safeName);

        await using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs, cancellationToken);

        return $"/{_settings.UploadPath}/avatars/{userId}/{safeName}".Replace('\\', '/');
    }

    public void DeleteFile(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return;

        var normalized = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(_rootPath, normalized.Replace($"{_settings.UploadPath}{Path.DirectorySeparatorChar}", ""));

        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }

    private void ValidateFile(string fileName, Stream stream, out string extension)
    {
        extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!_settings.AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            throw new AppException($"Invalid file type. Allowed: {string.Join(", ", _settings.AllowedExtensions)}");

        if (stream.CanSeek && stream.Length > _settings.MaxFileSizeBytes)
            throw new AppException("File size exceeds 5 MB limit");
    }
}
