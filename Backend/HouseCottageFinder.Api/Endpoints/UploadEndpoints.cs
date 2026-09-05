namespace HouseCottageFinder.Api.Endpoints;

public static class UploadEndpoints
{
    public static IEndpointRouteBuilder MapUploadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/upload", async (HttpRequest request) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest(new { message = "No form data" });

            var form = await request.ReadFormAsync();
            var files = form.Files;

            if (files.Count == 0)
                return Results.BadRequest(new { message = "No files uploaded" });

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsDir);

            var urls = new List<string>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var ext = Path.GetExtension(file.FileName).ToLower();
                var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
                if (!allowed.Contains(ext))
                    continue;

                var fileName = $"{Guid.NewGuid()}{ext}";
                var filePath = Path.Combine(uploadsDir, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                urls.Add($"/uploads/{fileName}");
            }

            return Results.Ok(new { urls });
        }).WithName("UploadFiles");

        return app;
    }
}
