using HouseCottageFinder.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Endpoints;

public static class PropertyEndpoints
{
    public static IEndpointRouteBuilder MapPropertyEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/properties", async (
            AppDbContext db,
            double? lat,
            double? lon,
            double? radius,
            string? dealType,
            decimal? minPrice,
            decimal? maxPrice) =>
        {
            var query = db.Properties.AsQueryable();

            if (!string.IsNullOrWhiteSpace(dealType) && !dealType.Equals("Any", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.DealType == dealType);
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            var properties = await query.OrderBy(p => p.CreatedAt).ToListAsync();

            if (lat.HasValue && lon.HasValue && radius.HasValue && radius.Value > 0)
            {
                properties = properties
                    .Where(p => DistanceInMeters(lat.Value, lon.Value, p.Latitude, p.Longitude) <= radius.Value * 1000)
                    .ToList();
            }

            return Results.Ok(properties);
        }).WithName("GetProperties");

        app.MapGet("/api/properties/{id:int}", async (int id, AppDbContext db) =>
        {
            var property = await db.Properties.FindAsync(id);

            return property is null
                ? Results.NotFound(new { message = "Property not found" })
                : Results.Ok(property);
        }).WithName("GetPropertyById");

        return app;
    }

    private static double DistanceInMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double EarthRadiusM = 6371000;
        double dLat = DegreeToRadian(lat2 - lat1);
        double dLon = DegreeToRadian(lon2 - lon1);
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(DegreeToRadian(lat1)) * Math.Cos(DegreeToRadian(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusM * c;
    }

    private static double DegreeToRadian(double deg) => deg * Math.PI / 180.0;
}