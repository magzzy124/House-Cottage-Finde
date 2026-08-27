using System.ComponentModel.DataAnnotations;

namespace HouseCottageFinder.Api.Models;

public class PriceHistory
{
    [Key]
    public int Id { get; set; }

    public int PropertyId { get; set; }

    public decimal Price { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}
