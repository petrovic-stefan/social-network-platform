namespace SocialNetwork.Application.Interfaces;

public interface ISocialActionsService
{
    Task FollowAsync(int fromUserId, int toUserId);
    Task UnfollowAsync(int fromUserId, int toUserId);
    Task LikePostAsync(int userId, int postId);
    Task UnlikePostAsync(int userId, int postId);
    Task MarkNotificationsReadAsync(int userId);
}
