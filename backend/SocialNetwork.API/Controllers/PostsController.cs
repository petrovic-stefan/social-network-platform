using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.API.Auth;
using SocialNetwork.API.Models;
using SocialNetwork.API.Services;
using SocialNetwork.Application.Posts;
using SocialNetwork.Infrastructure.Posts;
using System.Security.Claims;

namespace SocialNetwork.API.Controllers
{
    [ApiController]
    [Route("api/posts")]
    [Authorize]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _posts;
        private readonly FileStorage _fileStorage;
        public PostsController(IPostService postService,FileStorage fileStorage)
        {
            _posts = postService;
            _fileStorage = fileStorage;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePostRequest req)
        {
            var userId = User.GetUserId();
            var res = await _posts.CreateAsync(userId, req);
            return Ok(res);
        }

        [HttpPost("multipart")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(5 * 1024 * 1024)] 
        public async Task<IActionResult> CreateMultipart([FromForm] CreatePostMultipartRequest req)
        {
            var userId = User.GetUserId();

            if (string.IsNullOrWhiteSpace(req.PostText))
                return BadRequest(new { message = "postText is required." });

            string? relativePath = null;     
            string? savedFileName = null;    

            if (req.File is not null && req.File.Length > 0)
            {
                const long maxBytes = 5 * 1024 * 1024;
                if (req.File.Length > maxBytes)
                    return BadRequest(new { message = "File too large (max 5MB)." });

                var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var ext = Path.GetExtension(req.File.FileName).ToLowerInvariant();
                if (!allowed.Contains(ext))
                    return BadRequest(new { message = "Invalid file type. Allowed: jpg, jpeg, png, webp." });

                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "posts");
                Directory.CreateDirectory(uploadsDir);

                savedFileName = $"{Guid.NewGuid():N}{ext}";
                relativePath = $"posts/{savedFileName}";

                var fullPath = Path.Combine(uploadsDir, savedFileName);

                await using (var stream = System.IO.File.Create(fullPath))
                {
                    await req.File.CopyToAsync(stream);
                }
            }

            try
            {
                var res = await _posts.CreateAsync(
                    userId,
                    new CreatePostRequest(req.PostText, relativePath));

                var postImgUrl = string.IsNullOrWhiteSpace(relativePath)
                    ? null
                    : $"{Request.Scheme}://{Request.Host}/uploads/{relativePath}";

                return Ok(new
                {
                    res.NewPostId,
                    postImg = relativePath,   
                    postImgUrl
                });
            }
            catch
            {
                if (!string.IsNullOrWhiteSpace(savedFileName))
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "posts");
                    var fullPath = Path.Combine(uploadsDir, savedFileName);
                    if (System.IO.File.Exists(fullPath))
                        System.IO.File.Delete(fullPath);
                }

                throw;
            }
        }
        [HttpGet("{postId:int}")]
        [Authorize]
        public async Task<IActionResult> GetById(int postId)
        {
            var viewerId = User.GetUserId();
            var post = await _posts.GetByIdAsync(viewerId, postId);

            if (post == null)
                return NotFound();

            return Ok(post);
        }
        [HttpDelete("{postId:int}")]
        public async Task<IActionResult> Delete(int postId)
        {
            var userId = User.GetUserId();
            var post = await _posts.GetByIdAsync(userId, postId);
            if (post == null)
                return NotFound();

            var imagePath = post.PostImg; 

            await _posts.DeleteAsync(userId, postId);

            _fileStorage.DeletePostImage(imagePath);

            return Ok(new { message = "Post deleted (soft)" });
        }
        [HttpGet("feed")]
        public async Task<IActionResult> GetFeed([FromQuery] int take = 30, [FromQuery] DateTime? before = null)
        {
            var viewerIdStr =
                User.FindFirst("userId")?.Value ??
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(viewerIdStr) || !int.TryParse(viewerIdStr, out var viewerId))
                return Unauthorized(new { message = "Invalid token: missing userId claim." });

            var feed = await _posts.GetFeedAsync(viewerId, take, before);
            return Ok(feed);
        }
        [HttpPut("{postId:int}")]
        public async Task<IActionResult> Update(int postId, [FromBody] UpdatePostRequest req)
        {
            var userId = User.GetUserId();
            await _posts.UpdateAsync(userId, postId, req);
            return Ok(new { message = "Post updated" });
        }

    }
}
