namespace HouseCottageFinder.Api.Models;

public record CreatePropertyRequest(
    string Title,
    string Address,
    string City,
    string DealType,
    decimal Price,
    int Bedrooms,
    int Bathrooms,
    int Area,
    double Latitude,
    double Longitude,
    string? Description,
    string? ImageUrl
);
