using HouseCottageFinder.Api.Data;
using HouseCottageFinder.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HouseCottageFinder.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/login",
            async (LoginRequest request, AppDbContext db, IPasswordHasher<User> hasher, ILogger<Program> logger) =>
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

            logger.LogInformation("User logged in: {Id} {Email}", user.Id, user.Email);

            return Results.Ok(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                username = user.Username,
                email = user.Email
            });
        }).WithName("Login");

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

        return app;
    }
}