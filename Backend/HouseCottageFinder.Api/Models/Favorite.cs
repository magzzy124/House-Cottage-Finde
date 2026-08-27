using System.ComponentModel.DataAnnotations;

namespace HouseCottageFinder.Api.Models;

public class Favorite
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public int PropertyId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
