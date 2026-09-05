using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Services;

public static class NotificationService
{
    public static async Task CheckAndCreateNotifications(AppDbContext db, Property property)
    {
        var savedSearches = await db.SavedSearches.ToListAsync();

        foreach (var search in savedSearches)
        {
            if (MatchesSearch(property, search))
            {
                var alreadyNotified = await db.Notifications.AnyAsync(n =>
                    n.UserId == search.UserId && n.PropertyId == property.Id);

                if (alreadyNotified) continue;

                var notification = new Notification
                {
                    UserId = search.UserId,
                    PropertyId = property.Id,
                    Title = "New listing matches your saved search",
                    Message = $"A new {property.DealType.ToLower()} listing in {property.City} " +
                              $"for ${property.Price:N0} matches your search \"{search.Name ?? "Unnamed search"}\".",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                db.Notifications.Add(notification);
            }
        }

        await db.SaveChangesAsync();
    }

    private static bool MatchesSearch(Property property, SavedSearch search)
    {
        if (!string.IsNullOrWhiteSpace(search.DealType) &&
            !search.DealType.Equals("Any", StringComparison.OrdinalIgnoreCase) &&
            !search.DealType.Equals(property.DealType, StringComparison.OrdinalIgnoreCase))
            return false;

        if (search.MinPrice.HasValue && property.Price < search.MinPrice.Value)
            return false;

        if (search.MaxPrice.HasValue && property.Price > search.MaxPrice.Value)
            return false;

        if (search.MinBedrooms.HasValue && property.Bedrooms < search.MinBedrooms.Value)
            return false;

        if (search.MaxBedrooms.HasValue && property.Bedrooms > search.MaxBedrooms.Value)
            return false;

        if (search.MinArea.HasValue && property.Area < search.MinArea.Value)
            return false;

        if (search.MaxArea.HasValue && property.Area > search.MaxArea.Value)
            return false;

        if (search.Lat.HasValue && search.Lon.HasValue && search.RadiusKm.HasValue && search.RadiusKm.Value > 0)
        {
            var distanceKm = DistanceInKm(search.Lat.Value, search.Lon.Value, property.Latitude, property.Longitude);
            if (distanceKm > search.RadiusKm.Value)
                return false;
        }

        return true;
    }

    private static double DistanceInKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double EarthRadiusKm = 6371;
        double dLat = DegreeToRadian(lat2 - lat1);
        double dLon = DegreeToRadian(lon2 - lon1);
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(DegreeToRadian(lat1)) * Math.Cos(DegreeToRadian(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
    }

    private static double DegreeToRadian(double deg) => deg * Math.PI / 180.0;
}
