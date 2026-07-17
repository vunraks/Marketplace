using VaultTrade.API.Hubs;
using VaultTrade.API.Middlewares;
using VaultTrade.Application;
using VaultTrade.Infrastructure;
using VaultTrade.Infrastructure.Configurations;
using VaultTrade.Infrastructure.Data;

Environment.SetEnvironmentVariable("DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE", "false");

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers(options => options.Filters.Add<ValidationFilter>());
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"];
        origins = origins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim().TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "VaultTrade API v1"));
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

var storagePath = builder.Configuration.GetSection(StorageSettings.SectionName).Get<StorageSettings>()?.UploadPath ?? "uploads";
var uploadsFullPath = app.Environment.IsProduction()
    ? Path.Combine(Path.GetTempPath(), "vaulttrade", storagePath.Trim('/', '\\'))
    : Path.Combine(app.Environment.ContentRootPath, storagePath);
Directory.CreateDirectory(uploadsFullPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsFullPath),
    RequestPath = $"/{storagePath}"
});

if (!app.Environment.IsProduction())
    app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await DbSeeder.SeedAsync(context, logger);
}

app.Run();
