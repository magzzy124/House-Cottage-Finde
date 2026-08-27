using System.ComponentModel.DataAnnotations;

namespace HouseCottageFinder.Api.Models;

public class Message
{
    [Key]
    public int Id { get; set; }

    public int PropertyId { get; set; }

    public int SenderId { get; set; }

    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
