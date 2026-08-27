using HouseCottageFinder.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Endpoints;

public static class StatsEndpoints
{
    public static IEndpointRouteBuilder MapStatsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/stats/regions", async (AppDbContext db) =>
        {
            var regions = await db.Properties
                .GroupBy(p => p.City)
                .Select(g => new
                {
                    city = g.Key,
                    totalListings = g.Count(),
                    forSale = g.Count(p => p.DealType == "For sale"),
                    forRent = g.Count(p => p.DealType == "For rent"),
                    avgPrice = Math.Round(g.Average(p => p.Price), 2),
                    avgPricePerSqm = g.Count() > 0
                        ? Math.Round(g.Average(p => p.Price / (p.Area > 0 ? p.Area : 1)), 2)
                        : 0,
                    minPrice = g.Min(p => p.Price),
                    maxPrice = g.Max(p => p.Price),
                    avgArea = Math.Round(g.Average(p => p.Area), 0),
                    avgBedrooms = Math.Round(g.Average(p => p.Bedrooms), 1)
                })
                .OrderByDescending(r => r.totalListings)
                .ToListAsync();

            return Results.Ok(regions);
        }).WithName("GetRegionStats");

        app.MapGet("/api/stats/overview", async (AppDbContext db) =>
        {
            var total = await db.Properties.CountAsync();
            var forSale = await db.Properties.CountAsync(p => p.DealType == "For sale");
            var forRent = await db.Properties.CountAsync(p => p.DealType == "For rent");

            var avgPrice = total > 0
                ? Math.Round(await db.Properties.AverageAsync(p => p.Price), 2)
                : 0;

            var avgArea = total > 0
                ? Math.Round(await db.Properties.AverageAsync(p => p.Area), 0)
                : 0;

            var avgPricePerSqm = total > 0
                ? Math.Round(
                    await db.Properties
                        .Where(p => p.Area > 0)
                        .AverageAsync(p => p.Price / p.Area), 2)
                : 0;

            var cities = await db.Properties.Select(p => p.City).Distinct().CountAsync();

            var priceByDeal = await db.Properties
                .GroupBy(p => p.DealType)
                .Select(g => new
                {
                    dealType = g.Key,
                    count = g.Count(),
                    avgPrice = Math.Round(g.Average(p => p.Price), 2)
                })
                .ToListAsync();

            return Results.Ok(new
            {
                totalListings = total,
                forSale,
                forRent,
                avgPrice,
                avgArea,
                avgPricePerSqm,
                totalCities = cities,
                priceByDeal
            });
        }).WithName("GetOverviewStats");

        return app;
    }
}
