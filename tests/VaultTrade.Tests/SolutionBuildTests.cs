namespace VaultTrade.Tests;

public class SolutionBuildTests
{
    [Fact]
    public void Domain_Assembly_Should_Load()
    {
        var assembly = typeof(VaultTrade.Domain.Entities.User).Assembly;
        Assert.NotNull(assembly);
    }
}
