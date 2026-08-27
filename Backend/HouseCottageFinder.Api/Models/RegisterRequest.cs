namespace HouseCottageFinder.Api.Models;

public record RegisterRequest(
    string FirstName,
    string LastName,
    string Username,
    string Phone,
    string Email,
    string Password,
    string ConfirmPassword
);