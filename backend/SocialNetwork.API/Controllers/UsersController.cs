using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.API.Auth;
using SocialNetwork.Application.Posts;
using SocialNetwork.Application.Users;

namespace SocialNetwork.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _users;
        private readonly IPostService _posts;

        public UsersController(IUserService users, IPostService posts)
        {
            _users = users;
            _posts = posts;
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateMeRequest req)
        {
            var userId = User.GetUserId();
            await _users.UpdateMeAsync(userId, req);
            return Ok(new { message = "Profile updated" });
        }

        [HttpPut("me/profile-pic")]
        public async Task<IActionResult> UpdateProfilePic([FromBody] UpdateProfilePicRequest req)
        {
            var userId = User.GetUserId();
            await _users.UpdateProfilePicAsync(userId, req.ProfilePic);
            return Ok(new { message = "Profile picture updated" });
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = User.GetUserId();
            var me = await _users.GetMeAsync(userId);

            var baseUrl = $"{Request.Scheme}://{Request.Host}/uploads/";
            var profilePicUrl = string.IsNullOrWhiteSpace(me.Profile_Pic)
                ? null
                : baseUrl + me.Profile_Pic;

            return Ok(new
            {
                me.Users_Id,
                me.Username,
                me.Email,
                me.First_Name,
                me.Last_Name,
                me.Gender,
                me.Bio,
                me.Profile_Pic,
                profilePicUrl
            });
        }

        [HttpGet("{username}/profile")]
        public async Task<IActionResult> GetProfile(string username)
        {
            var viewerId = User.GetUserId();
            var profile = await _users.GetProfileByUsernameAsync(viewerId, username);
            if (profile == null) return NotFound();
            return Ok(profile);
        }

        [HttpGet("{username}/posts")]
        public async Task<IActionResult> GetUserPosts(string username, [FromQuery] int take = 24, [FromQuery] DateTime? before = null)
        {
            var viewerId = User.GetUserId();
            var posts = await _posts.GetByUsernameAsync(viewerId, username, take, before);
            return Ok(posts);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int take = 8)
        {
            var viewerId = User.GetUserId();

            q = (q ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(q))
                return Ok(Array.Empty<SearchUserDto>());

            take = Math.Clamp(take, 1, 20);

            var result = await _users.SearchAsync(viewerId, q, take);
            return Ok(result);
        }
    }
}