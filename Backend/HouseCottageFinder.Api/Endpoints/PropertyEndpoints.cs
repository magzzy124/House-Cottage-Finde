using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Models;
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
            decimal? maxPrice,
            int? minBedrooms,
            int? maxBedrooms,
            int? minArea,
            int? maxArea) =>
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

            if (minBedrooms.HasValue)
            {
                query = query.Where(p => p.Bedrooms >= minBedrooms.Value);
            }

            if (maxBedrooms.HasValue)
            {
                query = query.Where(p => p.Bedrooms <= maxBedrooms.Value);
            }

            if (minArea.HasValue)
            {
                query = query.Where(p => p.Area >= minArea.Value);
            }

            if (maxArea.HasValue)
            {
                query = query.Where(p => p.Area <= maxArea.Value);
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

        app.MapGet("/api/properties/{id:int}/price-history", async (int id, AppDbContext db) =>
        {
            var history = await db.PriceHistory
                .Where(ph => ph.PropertyId == id)
                .OrderBy(ph => ph.RecordedAt)
                .Select(ph => new { price = ph.Price, date = ph.RecordedAt })
                .ToListAsync();

            return Results.Ok(history);
        }).WithName("GetPriceHistory");

        app.MapPost("/api/properties", async (CreatePropertyRequest request, int userId, AppDbContext db) =>
        {
            var property = new Property
            {
                Title = request.Title,
                Address = request.Address,
                City = request.City,
                DealType = request.DealType,
                Price = request.Price,
                Bedrooms = request.Bedrooms,
                Bathrooms = request.Bathrooms,
                Area = request.Area,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Description = request.Description ?? "",
                ImageUrl = request.ImageUrl ?? "house.jpg"
            };

            db.Properties.Add(property);
            await db.SaveChangesAsync();

            return Results.Created($"/api/properties/{property.Id}", new { id = property.Id, message = "Listing created" });
        }).WithName("CreateProperty");

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