using Microsoft.Extensions.Configuration;
using Npgsql;

namespace VaultTrade.Infrastructure.Configurations;

public static class ConnectionStringHelper
{
    public static string GetPostgresConnectionString(IConfiguration configuration)
    {
        var connectionString = configuration["DATABASE_URL"]
            ?? configuration["POSTGRES_URL"]
            ?? configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("PostgreSQL connection string is not configured");

        var npgsqlConnectionString = connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
                ? ConvertPostgresUrl(connectionString)
                : connectionString;

        return NormalizeNpgsqlConnectionString(npgsqlConnectionString);
    }

    private static string ConvertPostgresUrl(string databaseUrl)
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(0) ?? string.Empty),
            Password = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? string.Empty),
            SslMode = SslMode.Require,
            GssEncryptionMode = GssEncryptionMode.Disable
        };

        return builder.ConnectionString;
    }

    private static string NormalizeNpgsqlConnectionString(string connectionString)
    {
        var builder = new NpgsqlConnectionStringBuilder(connectionString)
        {
            GssEncryptionMode = GssEncryptionMode.Disable
        };

        return builder.ConnectionString;
    }
}
