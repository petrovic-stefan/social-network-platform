using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Infrastructure.Data;
using Dapper;

namespace SocialNetwork.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Administrator")]
    public class AdminController : ControllerBase
    {
        private readonly ISqlConnectionFactory _db;
        public AdminController(ISqlConnectionFactory db) => _db = db;

        [HttpPost("ban/{userId:int}")]
        public async Task<IActionResult> Ban(int userId)
        {
            using var con = _db.Create();
            await con.ExecuteAsync(
                "UPDATE dbo.USERS SET IS_BANNED = 1 WHERE USERS_ID = @userId",
                new { userId });

            return Ok(new { message = "User banned" });
        }

        [HttpPost("unban/{userId:int}")]
        public async Task<IActionResult> Unban(int userId)
        {
            using var con = _db.Create();
            await con.ExecuteAsync(
                "UPDATE dbo.USERS SET IS_BANNED = 0 WHERE USERS_ID = @userId",
                new { userId });

            return Ok(new { message = "User unbanned" });
        }
    }
}
