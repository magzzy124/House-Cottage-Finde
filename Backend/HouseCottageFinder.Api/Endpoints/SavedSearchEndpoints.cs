using System.Security.Claims;
using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Endpoints;

public static class SavedSearchEndpoints
{
    public static IEndpointRouteBuilder MapSavedSearchEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/saved-searches", [Authorize] async (HttpContext http, AppDbContext db) =>
        {
            var userId = GetUserId(http);
            var searches = await db.SavedSearches
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return Results.Ok(searches);
        }).WithName("GetSavedSearches");

        app.MapPost("/api/saved-searches", [Authorize] async (SavedSearchRequest request, HttpContext http, AppDbContext db) =>
        {
            var userId = GetUserId(http);
            var search = new SavedSearch
            {
                UserId = userId,
                Name = request.Name,
                DealType = request.DealType,
                MinPrice = request.MinPrice,
                MaxPrice = request.MaxPrice,
                MinBedrooms = request.MinBedrooms,
                MaxBedrooms = request.MaxBedrooms,
                MinArea = request.MinArea,
                MaxArea = request.MaxArea,
                MinPlotSize = request.MinPlotSize,
                MaxPlotSize = request.MaxPlotSize,
                Lat = request.Lat,
                Lon = request.Lon,
                RadiusKm = request.RadiusKm
            };

            db.SavedSearches.Add(search);
            await db.SaveChangesAsync();

            return Results.Created($"/api/saved-searches/{search.Id}", new { id = search.Id, message = "Search saved" });
        }).WithName("SaveSearch");

        app.MapDelete("/api/saved-searches/{id:int}", async (int id, AppDbContext db) =>
        {
            var search = await db.SavedSearches.FindAsync(id);
            if (search is null) return Results.NotFound();
            db.SavedSearches.Remove(search);
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "Search deleted" });
        }).WithName("DeleteSavedSearch");

        return app;
    }

    private static int GetUserId(HttpContext http)
    {
        return int.Parse(http.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}

public record SavedSearchRequest(
    string? Name,
    string? DealType,
    decimal? MinPrice,
    decimal? MaxPrice,
    int? MinBedrooms,
    int? MaxBedrooms,
    int? MinArea,
    int? MaxArea,
    int? MinPlotSize,
    int? MaxPlotSize,
    double? Lat,
    double? Lon,
    double? RadiusKm
);
