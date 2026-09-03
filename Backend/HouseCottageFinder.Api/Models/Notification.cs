using System.ComponentModel.DataAnnotations;

namespace HouseCottageFinder.Api.Models;

public class Notification
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public int PropertyId { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
