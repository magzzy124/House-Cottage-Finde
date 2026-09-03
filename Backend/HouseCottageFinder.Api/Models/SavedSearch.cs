using System.ComponentModel.DataAnnotations;

namespace HouseCottageFinder.Api.Models;

public class SavedSearch
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [MaxLength(100)]
    public string? DealType { get; set; }

    public decimal? MinPrice { get; set; }

    public decimal? MaxPrice { get; set; }

    public int? MinBedrooms { get; set; }

    public int? MaxBedrooms { get; set; }

    public int? MinArea { get; set; }

    public int? MaxArea { get; set; }

    public double? Lat { get; set; }

    public double? Lon { get; set; }

    public double? RadiusKm { get; set; }

    [MaxLength(100)]
    public string? Name { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
