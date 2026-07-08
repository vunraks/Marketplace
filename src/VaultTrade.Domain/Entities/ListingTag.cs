namespace VaultTrade.Domain.Entities;

public class ListingTag
{
    public Guid ListingId { get; set; }
    public Listing Listing { get; set; } = null!;
    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}
