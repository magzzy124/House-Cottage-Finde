using HouseCottageFinder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!;

    public DbSet<Property> Properties { get; set; } = null!;

    public DbSet<Favorite> Favorites { get; set; } = null!;

    public DbSet<Message> Messages { get; set; } = null!;

    public DbSet<PriceHistory> PriceHistory { get; set; } = null!;

    public DbSet<Notification> Notifications { get; set; } = null!;

    public DbSet<SavedSearch> SavedSearches { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Property>().HasData(
            new Property { Id = 1, UserId = 0, Title = "Modern City Apartment", Address = "Knez Mihailova 12", City = "Belgrade", DealType = "For rent", Price = 950, Bedrooms = 2, Bathrooms = 1, Area = 62, Latitude = 44.8176, Longitude = 20.4569, Description = "Bright apartment in the heart of the city, close to all amenities.", ImageUrl = "house.jpg", ImageUrls = "house.jpg?v=1,house.jpg?v=2,house.jpg?v=3", CreatedAt = DateTime.UtcNow },
            new Property { Id = 2, UserId = 0, Title = "Cozy Suburban House", Address = "Bulevar Kralja Aleksandra 85", City = "Belgrade", DealType = "For sale", Price = 185000, Bedrooms = 4, Bathrooms = 2, Area = 140, Latitude = 44.8022, Longitude = 20.4774, Description = "Family home with a big yard and garage, quiet neighborhood.", ImageUrl = "house.jpg", ImageUrls = "house.jpg?v=1,house.jpg?v=2,house.jpg?v=3,house.jpg?v=4", CreatedAt = DateTime.UtcNow },
            new Property { Id = 3, UserId = 0, Title = "Seaside Cottage", Address = "Obala 3", City = "Budva", DealType = "For rent", Price = 750, Bedrooms = 2, Bathrooms = 1, Area = 55, Latitude = 42.2881, Longitude = 18.8426, Description = "Charming cottage with a sea view, perfect for a summer getaway.", ImageUrl = "house.jpg", ImageUrls = "house.jpg?v=1,house.jpg?v=2,house.jpg?v=3,house.jpg?v=4,house.jpg?v=5", CreatedAt = DateTime.UtcNow },
            new Property { Id = 4, UserId = 0, Title = "Suburban Villa", Address = "Ulica 8", City = "Novi Sad", DealType = "For sale", Price = 320000, Bedrooms = 5, Bathrooms = 3, Area = 210, Latitude = 45.2671, Longitude = 19.8335, Description = "Spacious villa with pool, garden and a modern interior.", ImageUrl = "house.jpg", ImageUrls = "house.jpg?v=1,house.jpg?v=2,house.jpg?v=3", CreatedAt = DateTime.UtcNow },
            new Property { Id = 5, UserId = 0, Title = "Studio Apartment", Address = "Kralja Petra 5", City = "Belgrade", DealType = "For rent", Price = 420, Bedrooms = 1, Bathrooms = 1, Area = 32, Latitude = 44.8206, Longitude = 20.4489, Description = "Compact studio, fully furnished, walking distance to downtown.", ImageUrl = "house.jpg", ImageUrls = "house.jpg?v=1,house.jpg?v=2", CreatedAt = DateTime.UtcNow },
            new Property { Id = 6, UserId = 0, Title = "Family Townhouse", Address = "Nemanjina 22", City = "Niš", DealType = "For sale", Price = 145000, Bedrooms = 3, Bathrooms = 2, Area = 110, Latitude = 43.3209, Longitude = 21.8952, Description = "Renovated townhouse with balcony and parking spot.", ImageUrl = "house.jpg", ImageUrls = "house.jpg?v=1,house.jpg?v=2,house.jpg?v=3,house.jpg?v=4", CreatedAt = DateTime.UtcNow },
            new Property { Id = 7, UserId = 0, Title = "Mountain Retreat", Address = "Planinski put 7", City = "Zlatibor", DealType = "For rent", Price = 600, Bedrooms = 3, Bathrooms = 2, Area = 95, Latitude = 43.7284, Longitude = 19.7016, Description = "Cozy retreat with fireplace, near the ski slopes.", ImageUrl = "house.jpg", ImageUrls = "house.jpg?v=1,house.jpg?v=2,house.jpg?v=3,house.jpg?v=4,house.jpg?v=5,house.jpg?v=6", CreatedAt = DateTime.UtcNow },
            new Property { Id = 8, UserId = 0, Title = "Designer Loft", Address = "Skadarska 14", City = "Belgrade", DealType = "For sale", Price = 265000, Bedrooms = 2, Bathrooms = 2, Area = 130, Latitude = 44.8162, Longitude = 20.4630, Description = "Industrial style loft with high ceilings and exposed brick.", ImageUrl = "house.jpg", ImageUrls = "house.jpg?v=1,house.jpg?v=2,house.jpg?v=3,house.jpg?v=4", CreatedAt = DateTime.UtcNow }
        );
    }
}