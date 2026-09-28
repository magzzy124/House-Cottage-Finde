using HouseCottageFinder.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Data;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher<User> hasher)
    {
        if (await db.Users.AnyAsync()) return;

        var owner = CreateUser(hasher, "Demo", "Owner", "owner", "owner@example.com", "owner123");
        var alice = CreateUser(hasher, "Alice", "Buyer", "alice", "alice@example.com", "alice123");
        var bob = CreateUser(hasher, "Bob", "Buyer", "bob", "bob@example.com", "bob123");

        db.Users.AddRange(owner, alice, bob);
        await db.SaveChangesAsync();

        var listing = new Property
        {
            UserId = owner.Id,
            Title = "Sunny Family House",
            Address = "Bulevar Oslobođenja 15",
            City = "Belgrade",
            DealType = "For sale",
            Price = 285000,
            Bedrooms = 4,
            Bathrooms = 2,
            Area = 145,
            PlotSize = 300,
            Latitude = 44.79,
            Longitude = 20.46,
            Description = "Spacious family house with a south-facing garden, two parking spots and a quiet street. Message me for a viewing!",
            ImageUrl = "house.jpg",
            ImageUrls = "house.jpg",
            CreatedAt = DateTime.UtcNow
        };

        db.Properties.Add(listing);
        await db.SaveChangesAsync();

        var now = DateTime.UtcNow;

        db.Messages.AddRange(
            Message(listing.Id, alice, owner, "Hi! Is the Sunny Family House still available?", now.AddMinutes(-60)),
            Message(listing.Id, owner, alice, "Hi Alice, yes it is! When would you like to come see it?", now.AddMinutes(-55)),
            Message(listing.Id, bob, owner, "Hello! Could you tell me more about the plot size?", now.AddMinutes(-30)),
            Message(listing.Id, owner, bob, "Hi Bob, the plot is 300 m2 and the garden is south-facing.", now.AddMinutes(-25))
        );

        db.Notifications.Add(new Notification
        {
            UserId = owner.Id,
            PropertyId = listing.Id,
            SenderId = alice.Id,
            Title = "New message",
            Message = "Alice Buyer sent you a message on \"Sunny Family House\".",
            IsRead = false,
            CreatedAt = now.AddMinutes(-60)
        });

        await db.SaveChangesAsync();
    }

    private static User CreateUser(
        IPasswordHasher<User> hasher,
        string firstName,
        string lastName,
        string username,
        string email,
        string password)
    {
        var user = new User
        {
            FirstName = firstName,
            LastName = lastName,
            Username = username,
            Phone = "+1 555 000 0000",
            Email = email
        };

        user.PasswordHash = hasher.HashPassword(user, password);
        return user;
    }

    private static Message Message(int propertyId, User sender, User recipient, string content, DateTime sentAt)
    {
        return new Message
        {
            PropertyId = propertyId,
            SenderId = sender.Id,
            RecipientId = recipient.Id,
            Content = content,
            IsRead = false,
            SentAt = sentAt
        };
    }
}
