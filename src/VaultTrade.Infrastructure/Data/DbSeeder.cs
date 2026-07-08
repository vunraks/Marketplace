using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VaultTrade.Domain.Constants;
using VaultTrade.Domain.Entities;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        await context.Database.MigrateAsync();

        if (!await context.Roles.AnyAsync())
        {
            context.Roles.AddRange(
                new Role { Name = RoleNames.User, Description = "Default registered user" },
                new Role { Name = RoleNames.Seller, Description = "Can create listings" },
                new Role { Name = RoleNames.Moderator, Description = "Can moderate content" },
                new Role { Name = RoleNames.Admin, Description = "Full system access" });
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded roles");
        }

        if (!await context.Categories.AnyAsync())
        {
            var gaming = new Category { Name = "Игровые аккаунты", Slug = "game-accounts", SortOrder = 1 };
            var items = new Category { Name = "Игровые предметы", Slug = "game-items", SortOrder = 2 };
            var software = new Category { Name = "Программное обеспечение", Slug = "software", SortOrder = 3 };
            var keys = new Category { Name = "Лицензионные ключи", Slug = "license-keys", SortOrder = 4 };
            var subs = new Category { Name = "Подписки", Slug = "subscriptions", SortOrder = 5 };
            var services = new Category { Name = "Цифровые услуги", Slug = "digital-services", SortOrder = 6 };

            context.Categories.AddRange(gaming, items, software, keys, subs, services);

            context.Categories.AddRange(
                new Category { Name = "Steam", Slug = "steam", Parent = gaming, SortOrder = 1 },
                new Category { Name = "Epic Games", Slug = "epic-games", Parent = gaming, SortOrder = 2 },
                new Category { Name = "Riot Games", Slug = "riot-games", Parent = gaming, SortOrder = 3 });

            await context.SaveChangesAsync();
            logger.LogInformation("Seeded categories");
        }

        if (!await context.Users.AnyAsync(u => u.Email == "admin@vaulttrade.local"))
        {
            var adminRole = await context.Roles.FirstAsync(r => r.Name == RoleNames.Admin);
            var userRole = await context.Roles.FirstAsync(r => r.Name == RoleNames.User);
            var sellerRole = await context.Roles.FirstAsync(r => r.Name == RoleNames.Seller);

            var admin = new User
            {
                Email = "admin@vaulttrade.local",
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                IsEmailVerified = true,
                FirstName = "System",
                LastName = "Administrator"
            };

            admin.UserRoles.Add(new UserRole { RoleId = adminRole.Id });
            admin.UserRoles.Add(new UserRole { RoleId = userRole.Id });
            admin.UserRoles.Add(new UserRole { RoleId = sellerRole.Id });
            admin.SellerRating = new SellerRating { SellerId = admin.Id };

            context.Users.Add(admin);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded admin user: admin@vaulttrade.local / Admin123!");
        }
    }
}
