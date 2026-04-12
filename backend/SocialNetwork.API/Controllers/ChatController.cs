using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.API.Auth;
using SocialNetwork.Application.Chat;
using Microsoft.AspNetCore.SignalR;
using SocialNetwork.API.Hubs;

namespace SocialNetwork.API.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chat;
        private readonly IHubContext<ChatHub> _hub;

        public ChatController(IChatService chat, IHubContext<ChatHub> hub)
        {
            _chat = chat;
            _hub = hub;
        }

        [HttpPost("dm/{otherUserId:int}")]
        public async Task<IActionResult> GetOrCreateDm(int otherUserId)
        {
            var userId = User.GetUserId();
            var conversationId = await _chat.GetOrCreateDmConversationAsync(userId, otherUserId);
            return Ok(new { conversationId });
        }

        [HttpGet("inbox")]
        public async Task<IActionResult> Inbox()
        {
            var userId = User.GetUserId();
            return Ok(await _chat.GetInboxAsync(userId));
        }

        [HttpGet("{conversationId:int}/messages")]
        public async Task<IActionResult> Messages(int conversationId, [FromQuery] int take = 50)
        {
            var userId = User.GetUserId();
            return Ok(await _chat.GetMessagesAsync(conversationId, userId, take));
        }

        [HttpPost("{conversationId:int}/messages")]
        public async Task<IActionResult> Send(int conversationId, [FromBody] SendMessageRequest req)
        {
            var userId = User.GetUserId();

            try
            {
                var text = (req.Text ?? string.Empty).Trim();

                if (string.IsNullOrWhiteSpace(text))
                    return BadRequest(new { error = "Message text is required." });

                var messageId = await _chat.SendMessageAsync(conversationId, userId, text);

                var peerUserId = await _chat.GetDmPeerUserAsync(conversationId, userId);

                if (peerUserId.HasValue)
                {
                    await _hub.Clients.Group($"user:{peerUserId.Value}")
                        .SendAsync("chat:message", new
                        {
                            messageId = messageId,
                            conversationId = conversationId,
                            fromUserId = userId,
                            toUserId = peerUserId.Value,
                            text = text,
                            sentAt = DateTime.UtcNow
                        });
                }

                return Ok(new { messageId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{conversationId:int}/read")]
        public async Task<IActionResult> MarkRead(int conversationId)
        {
            var userId = User.GetUserId();

            await _chat.MarkReadAsync(conversationId, userId);

            var peerUserId = await _chat.GetDmPeerUserAsync(conversationId, userId);
            if (peerUserId.HasValue)
            {
                await _hub.Clients.Group($"user:{peerUserId.Value}")
                    .SendAsync("chat:read", new
                    {
                        conversationId,
                        readByUserId = userId,
                        readAt = DateTime.UtcNow
                    });
            }

            return Ok(new { message = "Marked as read" });
        }

        [HttpDelete("messages/{messageId:int}")]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            var userId = User.GetUserId();
            var isAdmin = User.IsInRole("Administrator");

            await _chat.DeleteMessageAsync(messageId, userId, isAdmin);

            return NoContent();
        }

        [HttpPost("{conversationId:int}/delivered")]
        public async Task<IActionResult> MarkDelivered(int conversationId)
        {
            var userId = User.GetUserId();

            var marked = await _chat.MarkDeliveredAsync(conversationId, userId);
            var peerId = await _chat.GetPeerUserIdAsync(conversationId, userId);

            await _hub.Clients.Group($"user:{peerId}")
                .SendAsync("chat:delivered", new
                {
                    conversationId,
                    deliveredByUserId = userId,
                    at = DateTime.UtcNow,
                    markedCount = marked
                });

            return Ok(new { markedCount = marked });
        }
    }
}