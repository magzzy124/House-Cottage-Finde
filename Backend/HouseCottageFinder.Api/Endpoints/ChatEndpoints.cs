using System.Security.Claims;
using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Hubs;
using HouseCottageFinder.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Endpoints;

public static class ChatEndpoints
{
    public static IEndpointRouteBuilder MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/chat/threads", [Authorize] async (HttpContext http, AppDbContext db) =>
        {
            var userId = GetUserId(http);
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

        app.MapGet("/api/chat/messages", [Authorize] async (HttpContext http, int propertyId, AppDbContext db) =>
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

        app.MapPost("/api/chat/messages", [Authorize] async (
            SendMessageRequest request,
            HttpContext http,
            AppDbContext db,
            IHubContext<ChatHub> hubContext) =>
        {
            var userId = GetUserId(http);
            var message = new Message
            {
                PropertyId = request.PropertyId,
                SenderId = userId,
                Content = request.Content
            };

            db.Messages.Add(message);
            await db.SaveChangesAsync();

            var sender = await db.Users.FindAsync(userId);

            var response = new
            {
                id = message.Id,
                propertyId = message.PropertyId,
                senderId = message.SenderId,
                senderName = sender != null ? sender.FirstName + " " + sender.LastName : "Unknown",
                content = message.Content,
                sentAt = message.SentAt
            };

            await hubContext.Clients
                .Group($"property_{request.PropertyId}")
                .SendAsync("ReceiveMessage", response);

            var property = await db.Properties.FindAsync(request.PropertyId);
            if (property != null)
            {
                int? recipientId = null;

                if (property.UserId != userId)
                {
                    recipientId = property.UserId;
                }
                else
                {
                    var lastOtherMessage = await db.Messages
                        .Where(m => m.PropertyId == request.PropertyId && m.SenderId != userId)
                        .OrderByDescending(m => m.SentAt)
                        .FirstOrDefaultAsync();
                    if (lastOtherMessage != null)
                        recipientId = lastOtherMessage.SenderId;
                }

                if (recipientId.HasValue)
                {
                    var alreadyNotified = await db.Notifications.AnyAsync(n =>
                        n.UserId == recipientId.Value &&
                        n.PropertyId == request.PropertyId &&
                        n.Title == "New message" &&
                        n.CreatedAt > DateTime.UtcNow.AddMinutes(-1));

                    if (!alreadyNotified)
                    {
                        var notification = new Notification
                        {
                            UserId = recipientId.Value,
                            PropertyId = request.PropertyId,
                            Title = "New message",
                            Message = $"{sender?.FirstName} {sender?.LastName} sent you a message on \"{property.Title}\".",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        db.Notifications.Add(notification);
                        await db.SaveChangesAsync();
                    }
                }
            }

            return Results.Ok(response);
        }).WithName("SendMessage");

        return app;
    }

    private static int GetUserId(HttpContext http)
    {
        return int.Parse(http.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}

public record SendMessageRequest(int PropertyId, string Content);
