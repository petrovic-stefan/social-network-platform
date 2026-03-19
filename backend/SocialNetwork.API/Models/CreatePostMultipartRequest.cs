using Microsoft.AspNetCore.Mvc;

namespace SocialNetwork.API.Models
{
    public sealed class CreatePostMultipartRequest
    {
        [FromForm(Name = "postText")]
        public string PostText { get; set; } = "";

        [FromForm(Name = "file")]
        public IFormFile? File { get; set; }
    }
}
