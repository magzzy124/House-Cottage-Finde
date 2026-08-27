using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Endpoints;

public static class FavoritesEndpoints
{
    public static IEndpointRouteBuilder MapFavoritesEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/favorites", async (int userId, AppDbContext db) =>
        {
            var favorites = await db.Favorites
                .Where(f => f.UserId == userId)
                .Join(db.Properties,
                    f => f.PropertyId,
                    p => p.Id,
                    (f, p) => new
                    {
                        f.Id,
                        f.PropertyId,
                        f.CreatedAt,
                        p.Title,
                        p.Address,
                        p.City,
                        p.DealType,
                        p.Price,
                        p.Bedrooms,
                        p.Bathrooms,
                        p.Area,
                        p.ImageUrl
                    })
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return Results.Ok(favorites);
        }).WithName("GetFavorites");

        app.MapGet("/api/favorites/check", async (int userId, int propertyId, AppDbContext db) =>
        {
            var isFavorited = await db.Favorites
                .AnyAsync(f => f.UserId == userId && f.PropertyId == propertyId);

            return Results.Ok(new { isFavorited });
        }).WithName("CheckFavorite");

        app.MapPost("/api/favorites/{propertyId:int}", async (int propertyId, int userId, AppDbContext db) =>
        {
            var exists = await db.Favorites
                .AnyAsync(f => f.UserId == userId && f.PropertyId == propertyId);

            if (exists)
            {
                return Results.Ok(new { message = "Already favorited" });
            }

            var favorite = new Favorite
            {
                UserId = userId,
                PropertyId = propertyId
            };

            db.Favorites.Add(favorite);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Added to favorites", favoriteId = favorite.Id });
        }).WithName("AddFavorite");

        app.MapDelete("/api/favorites/{propertyId:int}", async (int propertyId, int userId, AppDbContext db) =>
        {
            var favorite = await db.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.PropertyId == propertyId);

            if (favorite is null)
            {
                return Results.NotFound(new { message = "Favorite not found" });
            }

            db.Favorites.Remove(favorite);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Removed from favorites" });
        }).WithName("RemoveFavorite");

        return app;
    }
}
