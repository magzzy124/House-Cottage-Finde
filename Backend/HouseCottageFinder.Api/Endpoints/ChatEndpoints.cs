using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Endpoints;

public static class ChatEndpoints
{
    public static IEndpointRouteBuilder MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/chat/threads", async (int userId, AppDbContext db) =>
        {
            var threads = await db.Messages
                .Where(m => m.PropertyId > 0)
                .GroupBy(m => new { m.PropertyId, m.SenderId })
                .Select(g => new
                {
                    propertyId = g.Key.PropertyId,
                    senderId = g.Key.SenderId,
                    senderName = db.Users.Where(u => u.Id == g.Key.SenderId).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault(),
                    propertyTitle = db.Properties.Where(p => p.Id == g.Key.PropertyId).Select(p => p.Title).FirstOrDefault(),
                    lastMessage = g.OrderByDescending(m => m.SentAt).Select(m => m.Content).FirstOrDefault(),
                    lastMessageAt = g.OrderByDescending(m => m.SentAt).Select(m => m.SentAt).FirstOrDefault(),
                    unreadCount = g.Count(m => m.SenderId != userId)
                })
                .Where(t => t.senderId == userId || db.Favorites.Any(f => f.UserId == userId && f.PropertyId == t.propertyId))
                .OrderByDescending(t => t.lastMessageAt)
                .ToListAsync();

            return Results.Ok(threads);
        }).WithName("GetChatThreads");

        app.MapGet("/api/chat/messages", async (int propertyId, int userId, AppDbContext db) =>
        {
            var messages = await db.Messages
                .Where(m => m.PropertyId == propertyId)
                .Join(db.Users,
                    m => m.SenderId,
                    u => u.Id,
                    (m, u) => new
                    {
                        m.Id,
                        m.PropertyId,
                        m.SenderId,
                        senderName = u.FirstName + " " + u.LastName,
                        m.Content,
                        m.SentAt
                    })
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            return Results.Ok(messages);
        }).WithName("GetMessages");

        app.MapPost("/api/chat/messages", async (SendMessageRequest request, int userId, AppDbContext db) =>
        {
            var message = new Message
            {
                PropertyId = request.PropertyId,
                SenderId = userId,
                Content = request.Content
            };

            db.Messages.Add(message);
            await db.SaveChangesAsync();

            var sender = await db.Users.FindAsync(userId);

            return Results.Ok(new
            {
                id = message.Id,
                propertyId = message.PropertyId,
                senderId = message.SenderId,
                senderName = sender != null ? sender.FirstName + " " + sender.LastName : "Unknown",
                content = message.Content,
                sentAt = message.SentAt
            });
        }).WithName("SendMessage");

        return app;
    }
}

public record SendMessageRequest(int PropertyId, string Content);
