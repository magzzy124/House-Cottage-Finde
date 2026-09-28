using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace HouseCottageFinder.Api.Endpoints;

public static class AuthEndpoints
{
    private const string CookieName = "HcfAuth";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/login",
            async (LoginRequest request, AppDbContext db, IPasswordHasher<User> hasher,
                   IConfiguration config, HttpContext http, ILogger<Program> logger) =>
        {
            logger.LogInformation("Login attempt received for email: {Email}", request.Email);

            var user = await db.Users.SingleOrDefaultAsync(u => u.Email == request.Email);

            if (user is null)
            {
                return Results.Unauthorized();
            }

            var result = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return Results.Unauthorized();
            }

            var token = GenerateJwtToken(user, config);

            SetAuthCookie(http, token, config);

            logger.LogInformation("User logged in: {Id} {Email}", user.Id, user.Email);

            return Results.Ok(new
            {
                user = new
                {
                    id = user.Id,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    username = user.Username,
                    email = user.Email
                }
            });
        }).WithName("Login");

        app.MapPost("/api/auth/logout", (HttpContext http) =>
        {
            http.Response.Cookies.Delete(CookieName);
            return Results.Ok(new { message = "Logged out" });
        }).WithName("Logout");

        app.MapGet("/api/auth/me", [Authorize] async (HttpContext http, AppDbContext db) =>
        {
            var userId = GetUserId(http);
            var user = await db.Users.FindAsync(userId);
            if (user is null) return Results.NotFound(new { message = "User not found" });

            return Results.Ok(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                username = user.Username,
                email = user.Email
            });
        }).WithName("GetCurrentUser");

        app.MapPost("/api/auth/register",
            async (RegisterRequest request, AppDbContext db, IPasswordHasher<User> hasher, ILogger<Program> logger) =>
        {
            logger.LogInformation("Register attempt received: {@Request}", request);

            if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
            {
                return Results.BadRequest(new { message = "Passwords do not match" });
            }

            var exists = await db.Users.AnyAsync(u =>
                u.Email == request.Email || u.Username == request.Username);

            if (exists)
            {
                return Results.Conflict(new { message = "Email or username already in use" });
            }

            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Username = request.Username,
                Phone = request.Phone,
                Email = request.Email
            };

            user.PasswordHash = hasher.HashPassword(user, request.Password);

            db.Users.Add(user);
            await db.SaveChangesAsync();

            logger.LogInformation("User registered: {Id} {Email}", user.Id, user.Email);

            return Results.Created($"/api/users/{user.Id}", new { message = "User registered", userId = user.Id });
        }).WithName("Register");

        app.MapGet("/api/auth/profile", [Authorize] async (HttpContext http, AppDbContext db) =>
        {
            var userId = GetUserId(http);
            var user = await db.Users.FindAsync(userId);
            if (user is null) return Results.NotFound(new { message = "User not found" });

            var favoritesCount = await db.Favorites.CountAsync(f => f.UserId == user.Id);
            var memberSince = user.CreatedAt;

            return Results.Ok(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                username = user.Username,
                phone = user.Phone,
                email = user.Email,
                createdAt = memberSince,
                favoritesCount
            });
        }).WithName("GetProfile");

        app.MapPut("/api/auth/profile", [Authorize] async (HttpContext http, UpdateProfileRequest request, AppDbContext db, IPasswordHasher<User> hasher) =>
        {
            var userId = GetUserId(http);
            var user = await db.Users.FindAsync(userId);
            if (user is null) return Results.NotFound(new { message = "User not found" });

            if (!string.IsNullOrWhiteSpace(request.FirstName))
                user.FirstName = request.FirstName;
            if (!string.IsNullOrWhiteSpace(request.LastName))
                user.LastName = request.LastName;
            if (!string.IsNullOrWhiteSpace(request.Phone))
                user.Phone = request.Phone;

            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                var result = hasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword ?? "");
                if (result == PasswordVerificationResult.Failed)
                    return Results.BadRequest(new { message = "Current password is incorrect" });
                user.PasswordHash = hasher.HashPassword(user, request.NewPassword);
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                username = user.Username,
                email = user.Email,
                message = "Profile updated"
            });
        }).WithName("UpdateProfile");

        app.MapGet("/api/users/{id:int}", [Authorize] async (int id, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound(new { message = "User not found" });

            return Results.Ok(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                username = user.Username
            });
        }).WithName("GetUser");

        return app;
    }

    private static int GetUserId(HttpContext http)
    {
        return int.Parse(http.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    private static void SetAuthCookie(HttpContext http, string token, IConfiguration config)
    {
        var expirationMinutes = double.Parse(config["Jwt:ExpirationMinutes"]!);

        var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            MaxAge = TimeSpan.FromMinutes(expirationMinutes),
        };

        http.Response.Cookies.Append(CookieName, token, cookieOptions);
    }

    private static string GenerateJwtToken(User user, IConfiguration config)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(config["Jwt:ExpirationMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
