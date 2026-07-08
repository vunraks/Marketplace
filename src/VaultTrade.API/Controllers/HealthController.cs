using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaultTrade.Infrastructure.Data;

namespace VaultTrade.API.Controllers;

[ApiController]
[Route("api/v1/health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public HealthController(AppDbContext dbContext) => _dbContext = dbContext;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var dbHealthy = false;
        try
        {
            dbHealthy = await _dbContext.Database.CanConnectAsync(cancellationToken);
        }
        catch
        {
            dbHealthy = false;
        }

        var status = dbHealthy ? "Healthy" : "Degraded";
        return Ok(new
        {
            status,
            database = dbHealthy ? "Up" : "Down",
            timestamp = DateTime.UtcNow
        });
    }
}
