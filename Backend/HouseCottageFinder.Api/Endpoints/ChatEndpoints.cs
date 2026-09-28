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
        app.MapGet("/api/chat/threads", [Authorize] async (HttpContext http, AppDbContext db, int? propertyId) =>
        {
            var userId = GetUserId(http);

            var query = db.Messages.Where(m => m.SenderId == userId || m.RecipientId == userId);

            if (propertyId.HasValue)
                query = query.Where(m => m.PropertyId == propertyId.Value);

            var threads = await query
                .GroupBy(m => new { m.PropertyId, OtherUserId = m.SenderId == userId ? m.RecipientId : m.SenderId })
                .Select(g => new
                {
                    propertyId = g.Key.PropertyId,
                    otherUserId = g.Key.OtherUserId,
                    otherName = db.Users
                        .Where(u => u.Id == g.Key.OtherUserId)
                        .Select(u => u.FirstName + " " + u.LastName)
                        .FirstOrDefault(),
                    propertyTitle = db.Properties
                        .Where(p => p.Id == g.Key.PropertyId)
                        .Select(p => p.Title)
                        .FirstOrDefault(),
                    propertyImage = db.Properties
                        .Where(p => p.Id == g.Key.PropertyId)
                        .Select(p => p.ImageUrl)
                        .FirstOrDefault(),
                    lastMessage = g.OrderByDescending(m => m.SentAt).Select(m => m.Content).FirstOrDefault(),
                    lastMessageAt = g.OrderByDescending(m => m.SentAt).Select(m => m.SentAt).FirstOrDefault(),
                    unreadCount = g.Count(m => m.RecipientId == userId && !m.IsRead)
                })
                .OrderByDescending(t => t.lastMessageAt)
                .ToListAsync();

            return Results.Ok(threads);
        }).WithName("GetChatThreads");

        app.MapGet("/api/chat/messages", [Authorize] async (
            HttpContext http,
            int propertyId,
            int withUserId,
            AppDbContext db) =>
        {
            var userId = GetUserId(http);

            await db.Messages
                .Where(m =>
                    m.PropertyId == propertyId &&
                    m.SenderId == withUserId &&
                    m.RecipientId == userId &&
                    !m.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true));

            var messages = await db.Messages
                .Where(m =>
                    m.PropertyId == propertyId &&
                    ((m.SenderId == userId && m.RecipientId == withUserId) ||
                     (m.SenderId == withUserId && m.RecipientId == userId)))
                .Join(db.Users,
                    m => m.SenderId,
                    u => u.Id,
                    (m, u) => new
                    {
                        m.Id,
                        m.PropertyId,
                        m.SenderId,
                        m.RecipientId,
                        senderName = u.FirstName + " " + u.LastName,
                        m.Content,
                        m.SentAt,
                        m.IsRead
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

            if (string.IsNullOrWhiteSpace(request.Content))
                return Results.BadRequest(new { message = "Message cannot be empty" });

            if (request.PropertyId <= 0 || request.RecipientId <= 0)
                return Results.BadRequest(new { message = "Invalid conversation" });

            if (request.RecipientId == userId)
                return Results.BadRequest(new { message = "Cannot message yourself" });

            var property = await db.Properties.FindAsync(request.PropertyId);
            if (property is null) return Results.NotFound(new { message = "Property not found" });

            var recipient = await db.Users.FindAsync(request.RecipientId);
            if (recipient is null) return Results.NotFound(new { message = "Recipient not found" });

            var sender = await db.Users.FindAsync(userId);

            var message = new Message
            {
                PropertyId = request.PropertyId,
                SenderId = userId,
                RecipientId = request.RecipientId,
                Content = request.Content.Trim()
            };

            db.Messages.Add(message);
            await db.SaveChangesAsync();

            var response = new
            {
                id = message.Id,
                propertyId = message.PropertyId,
                senderId = message.SenderId,
                recipientId = message.RecipientId,
                senderName = sender != null ? sender.FirstName + " " + sender.LastName : "Unknown",
                content = message.Content,
                sentAt = message.SentAt,
                isRead = message.IsRead
            };

            var min = Math.Min(userId, message.RecipientId);
            var max = Math.Max(userId, message.RecipientId);

            await hubContext.Clients
                .Group($"conv_{message.PropertyId}_{min}_{max}")
                .SendAsync("ReceiveMessage", response);

            var alreadyNotified = await db.Notifications.AnyAsync(n =>
                n.UserId == message.RecipientId &&
                n.PropertyId == message.PropertyId &&
                n.SenderId == userId &&
                n.Title == "New message" &&
                !n.IsRead);

            if (!alreadyNotified)
            {
                db.Notifications.Add(new Notification
                {
                    UserId = message.RecipientId,
                    PropertyId = message.PropertyId,
                    SenderId = userId,
                    Title = "New message",
                    Message = $"{sender?.FirstName} {sender?.LastName} sent you a message on \"{property.Title}\".",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
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

public record SendMessageRequest(int PropertyId, int RecipientId, string Content);
