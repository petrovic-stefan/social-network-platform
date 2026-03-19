using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.API.Auth;
using SocialNetwork.Application.Comments;
using SocialNetwork.API.Realtime;
using SocialNetwork.Application.Posts;

namespace SocialNetwork.API.Controllers
{
    [ApiController]
    [Route("api")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _comments;
        private readonly INotificationRealtime _rt;
        private readonly IPostOwnerQuery _postOwner;
        public CommentsController(ICommentService comments,INotificationRealtime rt,IPostOwnerQuery postOwner)
        {
            _comments = comments;
            _rt = rt;
            _postOwner = postOwner;
        }

        // Add comment on post
        [HttpPost("posts/{postId:int}/comments")]
        [Authorize]
        public async Task<IActionResult> Add(int postId, [FromBody] AddCommentRequest req)
        {
            var userId = User.GetUserId();
            var fromUsername = User.GetUsername();

            await _comments.AddAsync(userId, postId, req);

            var ownerId = await _postOwner.GetOwnerIdAsync(postId);
            if (ownerId != userId)
            {
                await _rt.PushAsync(ownerId, new
                {
                    type = "comment",
                    fromUserId = userId,
                    fromUsername,
                    postId,
                    text = "commented on your post",
                    createdAt = DateTime.UtcNow
                });
            }

            return Ok(new { message = "Comment added" });
        }

        [HttpGet("posts/{postId:int}/comments")]
        public async Task<IActionResult> GetForPost(int postId)
            => Ok(await _comments.GetForPostAsync(postId));

        // Delete comment (samo autor)
        [HttpDelete("comments/{commentId:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int commentId)
        {
            var userId = User.GetUserId();
            await _comments.DeleteAsync(userId, commentId);
            return Ok(new { message = "Comment deleted" });
        }
    }
}
