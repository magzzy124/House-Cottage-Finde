using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Endpoints;
using HouseCottageFinder.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("Default"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("Default"))));

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS Notifications (
            Id INT AUTO_INCREMENT PRIMARY KEY,
            UserId INT NOT NULL,
            PropertyId INT NOT NULL,
            Title VARCHAR(200) NOT NULL,
            Message VARCHAR(500) NOT NULL,
            IsRead TINYINT(1) NOT NULL DEFAULT 0,
            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS SavedSearches (
            Id INT AUTO_INCREMENT PRIMARY KEY,
            UserId INT NOT NULL,
            DealType VARCHAR(100),
            MinPrice DECIMAL(18,2),
            MaxPrice DECIMAL(18,2),
            MinBedrooms INT,
            MaxBedrooms INT,
            MinArea INT,
            MaxArea INT,
            Lat DOUBLE,
            Lon DOUBLE,
            RadiusKm DOUBLE,
            Name VARCHAR(100),
            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    ");

    var hasBedrooms = false;
    using (var conn = db.Database.GetDbConnection())
    {
        await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Properties' AND COLUMN_NAME = 'Bedrooms'";
        var result = await cmd.ExecuteScalarAsync();
        hasBedrooms = Convert.ToInt32(result) > 0;
        conn.Close();
    }
    if (!hasBedrooms)
    {
        db.Database.ExecuteSqlRaw("ALTER TABLE Properties ADD COLUMN Bedrooms INT NOT NULL DEFAULT 0");
        db.Database.ExecuteSqlRaw("ALTER TABLE Properties ADD COLUMN Bathrooms INT NOT NULL DEFAULT 0");
        db.Database.ExecuteSqlRaw("ALTER TABLE Properties ADD COLUMN Area INT NOT NULL DEFAULT 0");
        db.Database.ExecuteSqlRaw("ALTER TABLE Properties ADD COLUMN CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.MapAuthEndpoints();
app.MapPropertyEndpoints();
app.MapFavoritesEndpoints();
app.MapStatsEndpoints();
app.MapChatEndpoints();
app.MapNotificationEndpoints();
app.MapSavedSearchEndpoints();

app.Run();