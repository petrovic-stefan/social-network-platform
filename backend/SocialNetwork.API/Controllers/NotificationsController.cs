using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.API.Auth;
using SocialNetwork.Application.Notifications;

namespace SocialNetwork.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notifications;
        public NotificationsController(INotificationService notifications) => _notifications = notifications;

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int take = 50)
        {
            var userId = User.GetUserId();
            return Ok(await _notifications.GetAsync(userId, take));
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount()
        {
            var userId = User.GetUserId();
            return Ok(await _notifications.GetUnreadCountAsync(userId));
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> ReadAll()
        {
            var userId = User.GetUserId();
            await _notifications.MarkAllReadAsync(userId);
            return Ok(new { message = "All notifications marked as read" });
        }
    }
}
