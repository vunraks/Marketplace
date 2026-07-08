using VaultTrade.Domain.Common;
using VaultTrade.Domain.Enums;

namespace VaultTrade.Domain.Entities;

public class Report : BaseEntity
{
    public Guid ReporterId { get; set; }
    public User Reporter { get; set; } = null!;
    public ReportTargetType TargetType { get; set; }
    public Guid TargetId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.New;
    public Guid? ResolvedById { get; set; }
    public User? ResolvedBy { get; set; }
    public string? ResolutionNote { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
