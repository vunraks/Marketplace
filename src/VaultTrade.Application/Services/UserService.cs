using AutoMapper;
using VaultTrade.Application.Common;
using VaultTrade.Application.DTOs.Users;
using VaultTrade.Application.Interfaces;
using VaultTrade.Domain.Constants;
using VaultTrade.Domain.Entities;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Application.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorage;
    private readonly IMapper _mapper;

    public UserService(IUnitOfWork unitOfWork, IFileStorageService fileStorage, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _fileStorage = fileStorage;
        _mapper = mapper;
    }

    public async Task<UserProfileDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        return _mapper.Map<UserProfileDto>(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        user.FirstName = request.FirstName?.Trim();
        user.LastName = request.LastName?.Trim();
        user.Bio = request.Bio?.Trim();
        user.Phone = request.Phone?.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<UserProfileDto>(user);
    }

    public async Task<string> UpdateAvatarAsync(Guid userId, Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        var url = await _fileStorage.SaveAvatarAsync(userId, fileStream, fileName, cancellationToken);
        user.AvatarUrl = url;
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return url;
    }

    public async Task<PublicUserProfileDto> GetPublicProfileAsync(string username, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByUsernameAsync(username.ToLowerInvariant(), cancellationToken)
            ?? throw new NotFoundException("User not found");

        return _mapper.Map<PublicUserProfileDto>(user);
    }

    public async Task<IReadOnlyList<AdminUserDto>> GetAllForAdminAsync(CancellationToken cancellationToken = default)
    {
        var users = await _unitOfWork.Users.GetAllAsync(cancellationToken);
        return users.Select(ToAdminDto).ToList();
    }

    public async Task<AdminUserDto> UpdateRolesAsync(Guid adminId, Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        var requestedRoles = request.Roles
            .Select(r => r.Trim())
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var allowedRoles = new[] { RoleNames.User, RoleNames.Seller, RoleNames.Moderator };
        if (requestedRoles.Any(r => !allowedRoles.Contains(r, StringComparer.OrdinalIgnoreCase)))
            throw new AppException("Only User, Seller and Moderator roles can be managed here");

        if (!requestedRoles.Contains(RoleNames.User, StringComparer.OrdinalIgnoreCase))
            requestedRoles.Insert(0, RoleNames.User);

        var existingAdminRole = user.UserRoles.FirstOrDefault(ur => ur.Role.Name == RoleNames.Admin);
        if (existingAdminRole is not null)
            requestedRoles.RemoveAll(r => string.Equals(r, RoleNames.Admin, StringComparison.OrdinalIgnoreCase));

        var roles = await _unitOfWork.Roles.GetAllAsync(cancellationToken);
        var roleMap = roles.ToDictionary(r => r.Name, StringComparer.OrdinalIgnoreCase);

        var requestedRoleIds = requestedRoles
            .Select(roleName => roleMap.TryGetValue(roleName, out var role)
                ? role.Id
                : throw new AppException($"Role {roleName} is not configured", 500))
            .ToHashSet();

        var removableRoles = user.UserRoles
            .Where(ur => ur.Role.Name != RoleNames.Admin && !requestedRoleIds.Contains(ur.RoleId))
            .ToList();

        foreach (var role in removableRoles)
            user.UserRoles.Remove(role);

        foreach (var roleId in requestedRoleIds)
        {
            if (user.UserRoles.All(ur => ur.RoleId != roleId))
            {
                user.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = roleId,
                    AssignedBy = adminId
                });
            }
        }

        if (requestedRoles.Contains(RoleNames.Seller, StringComparer.OrdinalIgnoreCase) && user.SellerRating is null)
            user.SellerRating = new SellerRating { SellerId = user.Id };

        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToAdminDto(user);
    }

    public async Task<AdminUserDto> AdjustBalanceAsync(Guid userId, AdjustUserBalanceRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Amount == 0)
            throw new AppException("Amount must not be zero");

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        var nextBalance = user.VirtualBalance + request.Amount;
        if (nextBalance < 0)
            throw new AppException("Balance cannot be negative");

        user.VirtualBalance = nextBalance;
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToAdminDto(user);
    }

    public async Task<AdminUserDto> UpdateBlockAsync(Guid userId, UpdateUserBlockRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        user.IsBlocked = request.IsBlocked;
        user.BlockedUntil = request.IsBlocked ? request.BlockedUntil : null;
        user.BlockReason = request.IsBlocked ? request.Reason?.Trim() : null;
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToAdminDto(user);
    }

    public async Task BecomeSellerAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found");

        if (user.UserRoles.Any(ur => ur.Role.Name == RoleNames.Seller))
            throw new ConflictException("User is already a seller");

        var sellerRole = await _unitOfWork.Roles.GetByNameAsync(RoleNames.Seller, cancellationToken)
            ?? throw new AppException("Seller role is not configured", 500);

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = sellerRole.Id,
            AssignedBy = userId
        });

        if (user.SellerRating is null)
        {
            user.SellerRating = new SellerRating { SellerId = user.Id };
        }

        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static AdminUserDto ToAdminDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Username = user.Username,
        IsActive = user.IsActive,
        IsBlocked = user.IsBlocked,
        BlockedUntil = user.BlockedUntil,
        BlockReason = user.BlockReason,
        IsEmailVerified = user.IsEmailVerified,
        VirtualBalance = user.VirtualBalance,
        Roles = user.UserRoles.Select(ur => ur.Role.Name).OrderBy(r => r).ToList(),
        ListingsCount = user.Listings.Count,
        LastLoginAt = user.LastLoginAt,
        CreatedAt = user.CreatedAt
    };
}
