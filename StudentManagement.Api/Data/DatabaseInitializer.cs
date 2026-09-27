using Microsoft.EntityFrameworkCore;

namespace StudentManagement.Api.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, ILogger logger, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await dbContext.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("StudentManagementDb migrations are applied and the database is ready.");
    }
}
