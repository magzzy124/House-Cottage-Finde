using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/notifications", async (int userId, AppDbContext db) =>
        {
            var notifications = await db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.PropertyId,
                    n.Title,
                    n.Message,
                    n.IsRead,
                    n.CreatedAt,
                    propertyTitle = db.Properties.Where(p => p.Id == n.PropertyId).Select(p => p.Title).FirstOrDefault()
                })
                .ToListAsync();

            return Results.Ok(notifications);
        }).WithName("GetNotifications");

        app.MapGet("/api/notifications/unread-count", async (int userId, AppDbContext db) =>
        {
            var count = await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
            return Results.Ok(new { count });
        }).WithName("GetUnreadNotificationCount");

        app.MapPut("/api/notifications/{id:int}/read", async (int id, AppDbContext db) =>
        {
            var notification = await db.Notifications.FindAsync(id);
            if (notification is null) return Results.NotFound();
            notification.IsRead = true;
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "Marked as read" });
        }).WithName("MarkNotificationRead");

        app.MapPut("/api/notifications/read-all", async (int userId, AppDbContext db) =>
        {
            var notifications = await db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in notifications)
                n.IsRead = true;

            await db.SaveChangesAsync();
            return Results.Ok(new { message = "All marked as read" });
        }).WithName("MarkAllNotificationsRead");

        return app;
    }
}
