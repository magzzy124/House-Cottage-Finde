namespace HouseCottageFinder.Api.Models;

public record UpdateProfileRequest(
    string? FirstName,
    string? LastName,
    string? Phone,
    string? CurrentPassword,
    string? NewPassword
);
