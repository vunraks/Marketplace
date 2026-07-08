namespace VaultTrade.Infrastructure.Configurations;

public class JwtSettings
{
    public const string SectionName = "Jwt";
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "VaultTrade";
    public string Audience { get; set; } = "VaultTrade.Web";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}

public class StorageSettings
{
    public const string SectionName = "Storage";
    public string UploadPath { get; set; } = "uploads";
    public long MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024;
    public string[] AllowedExtensions { get; set; } = [".jpg", ".jpeg", ".png", ".webp"];
}

public class ExternalAuthSettings
{
    public const string SectionName = "Authentication";
    public GoogleAuthSettings Google { get; set; } = new();
}

public class GoogleAuthSettings
{
    public string ClientId { get; set; } = string.Empty;
}
