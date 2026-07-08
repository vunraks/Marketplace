using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using VaultTrade.Application.Interfaces;
using VaultTrade.Application.Mapping;
using VaultTrade.Application.Services;

namespace VaultTrade.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(MappingProfile));
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IListingService, ListingService>();

        return services;
    }
}
