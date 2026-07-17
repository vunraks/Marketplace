using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VaultTrade.Application.Helpers;
using VaultTrade.Domain.Constants;
using VaultTrade.Domain.Entities;
using VaultTrade.Domain.Enums;
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

        if (await context.Listings.CountAsync() < 8)
        {
            var seller = await context.Users
                .Include(u => u.UserRoles)
                .FirstAsync(u => u.Email == "admin@vaulttrade.local");
            var categories = await context.Categories.ToDictionaryAsync(c => c.Slug);
            var tagsBySlug = await context.Tags.ToDictionaryAsync(t => t.Slug, StringComparer.OrdinalIgnoreCase);
            var tagsByName = await context.Tags.ToDictionaryAsync(t => t.Name, StringComparer.OrdinalIgnoreCase);
            var now = DateTime.UtcNow;

            var listings = new[]
            {
                new { Category = "steam", Title = "Steam аккаунт с библиотекой 120+ игр", Price = 12500m, Stock = 3, Image = "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=80", Tags = new[] { "steam", "аккаунт", "игры" } },
                new { Category = "steam", Title = "Steam профиль с высоким уровнем и Prime", Price = 8900m, Stock = 2, Image = "https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=900&q=80", Tags = new[] { "steam", "prime", "профиль" } },
                new { Category = "epic-games", Title = "Epic Games аккаунт с редкими раздачами", Price = 4300m, Stock = 5, Image = "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80", Tags = new[] { "epic", "аккаунт" } },
                new { Category = "riot-games", Title = "Valorant аккаунт с премиум скинами", Price = 15900m, Stock = 1, Image = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80", Tags = new[] { "valorant", "skins" } },
                new { Category = "riot-games", Title = "League of Legends аккаунт Gold+", Price = 7600m, Stock = 4, Image = "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80", Tags = new[] { "lol", "ranked" } },
                new { Category = "game-items", Title = "Набор редких игровых предметов", Price = 2100m, Stock = 15, Image = "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=900&q=80", Tags = new[] { "items", "loot" } },
                new { Category = "game-items", Title = "Премиум валюта для MMO", Price = 3400m, Stock = 20, Image = "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=900&q=80", Tags = new[] { "mmo", "currency" } },
                new { Category = "license-keys", Title = "Ключ Windows 11 Pro", Price = 1800m, Stock = 12, Image = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80", Tags = new[] { "windows", "key" } },
                new { Category = "license-keys", Title = "Office 2024 ключ активации", Price = 2400m, Stock = 8, Image = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80", Tags = new[] { "office", "license" } },
                new { Category = "subscriptions", Title = "Подписка Spotify Premium 12 месяцев", Price = 2900m, Stock = 10, Image = "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?auto=format&fit=crop&w=900&q=80", Tags = new[] { "spotify", "premium" } },
                new { Category = "subscriptions", Title = "Подписка YouTube Premium 6 месяцев", Price = 2200m, Stock = 7, Image = "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=900&q=80", Tags = new[] { "youtube", "premium" } },
                new { Category = "digital-services", Title = "Буст рейтинга и помощь в игре", Price = 5200m, Stock = 6, Image = "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80", Tags = new[] { "boost", "service" } }
            };

            foreach (var item in listings.Select((value, index) => new { value, index }))
            {
                var listing = new Listing
                {
                    SellerId = seller.Id,
                    CategoryId = categories[item.value.Category].Id,
                    Title = item.value.Title,
                    Slug = $"seed-{item.index + 1}-{Guid.NewGuid().ToString("N")[..8]}",
                    Description = $"Проверенное объявление от продавца VaultTrade. В наличии {item.value.Stock} шт., выдача после оплаты и подтверждения заказа.",
                    Price = item.value.Price,
                    StockQuantity = item.value.Stock,
                    DeliveryInfo = "Данные передаются в чате после оформления заказа.",
                    Status = ListingStatus.Active,
                    PublishedAt = now.AddDays(-item.index),
                    CreatedAt = now.AddDays(-item.index),
                    UpdatedAt = now.AddDays(-item.index),
                    Images =
                    {
                        new ListingImage
                        {
                            Url = item.value.Image,
                            AltText = item.value.Title,
                            IsPrimary = true,
                            SortOrder = 0
                        }
                    }
                };

                foreach (var tag in item.value.Tags)
                {
                    var name = tag.Trim();
                    var slug = SlugHelper.GenerateSlug(name);
                    if (!tagsBySlug.TryGetValue(slug, out var tagEntity) &&
                        !tagsByName.TryGetValue(name, out tagEntity))
                    {
                        tagEntity = new Tag { Name = name, Slug = slug };
                        tagsBySlug[slug] = tagEntity;
                        tagsByName[name] = tagEntity;
                    }

                    listing.ListingTags.Add(new ListingTag { Tag = tagEntity });
                }

                context.Listings.Add(listing);
            }

            await context.SaveChangesAsync();
            logger.LogInformation("Seeded demo marketplace listings");
        }
    }
}
