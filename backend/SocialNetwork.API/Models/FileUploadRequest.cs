using Microsoft.AspNetCore.Mvc;

namespace SocialNetwork.API.Models
{
    public sealed class FileUploadRequest
    {
        [FromForm(Name = "file")]
        public IFormFile File { get; set; } = default!;
    }
}
