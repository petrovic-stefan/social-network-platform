using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.API.Auth;
using SocialNetwork.API.Realtime;
using SocialNetwork.Application.Interfaces;
using SocialNetwork.Application.Posts;

namespace SocialNetwork.API.Controllers;

[ApiController]
[Route("api/social")]
[Authorize]
public class SocialController : ControllerBase
{
    private readonly ISocialActionsService _social;
    private readonly INotificationRealtime _rt;
    private readonly IPostOwnerQuery _postOwner;

    public SocialController(ISocialActionsService social, INotificationRealtime rt, IPostOwnerQuery postOwner)
    {
        _social = social;
        _rt = rt;
        _postOwner = postOwner;
    }

    [HttpPost("follow/{toUserId:int}")]
    public async Task<IActionResult> Follow(int toUserId)
    {
        var fromUserId = User.GetUserId();
        var fromUsername = User.GetUsername();
        await _social.FollowAsync(fromUserId, toUserId);

        await _rt.PushAsync(toUserId, new
        {
            type = "follow",
            fromUserId,
            fromUsername,
            text = "started following you",
            createdAt = DateTime.UtcNow
        });

        return Ok(new { message = "Followed successfully" });
    }

    [HttpPost("unfollow/{toUserId:int}")]
    public async Task<IActionResult> Unfollow(int toUserId)
    {
        var fromUserId = User.GetUserId();
        await _social.UnfollowAsync(fromUserId, toUserId);
        return Ok(new { message = "Unfollowed successfully" });
    }
    [HttpPost("like/{postId:int}")]
    public async Task<IActionResult> Like(int postId)
    {
        var userId = User.GetUserId();
        var fromUsername= User.GetUsername();
        await _social.LikePostAsync(userId, postId);

        var ownerId = await _postOwner.GetOwnerIdAsync(postId);
        if (ownerId != userId)
        {
            await _rt.PushAsync(ownerId, new
            {
                type = "like",
                fromUserId = userId,
                fromUsername,
                postId,
                text = "liked your post",
                createdAt = DateTime.UtcNow
            });
        }

        return Ok(new { message = "Liked successfully" });
    }

    [HttpPost("unlike/{postId:int}")]
    public async Task<IActionResult> Unlike(int postId)
    {
        var userId = User.GetUserId();
        await _social.UnlikePostAsync(userId, postId);
        return Ok(new { message = "Unliked successfully" });
    }

    [HttpPost("notifications/read")]
    public async Task<IActionResult> MarkNotificationsAsRead()
    {
        var userId = User.GetUserId();
        await _social.MarkNotificationsReadAsync(userId);
        return Ok(new { message = "Notifications marked as read" });
    }
}
