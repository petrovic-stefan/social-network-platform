using Dapper;
using SocialNetwork.Application.Interfaces;
using SocialNetwork.Infrastructure.Data;
using System.Data;

namespace SocialNetwork.Infrastructure.Services;

public sealed class SocialActionsService : ISocialActionsService
{
    private readonly ISqlConnectionFactory _db;

    public SocialActionsService(ISqlConnectionFactory db)
    {
        _db = db;
    }

    public async Task FollowAsync(int fromUserId, int toUserId)
    {
        using var con = _db.Create();
        await con.ExecuteAsync(
            "dbo.FollowUser",
            new { FromUserId = fromUserId, ToUserId = toUserId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UnfollowAsync(int fromUserId, int toUserId)
    {
        using var con = _db.Create();
        await con.ExecuteAsync(
            "dbo.UnfollowUser",
            new { FromUserId = fromUserId, ToUserId = toUserId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task LikePostAsync(int userId, int postId)
    {
        using var con = _db.Create();
        await con.ExecuteAsync(
            "dbo.AddLike",
            new { UserId = userId, PostId = postId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UnlikePostAsync(int userId, int postId)
    {
        using var con = _db.Create();
        await con.ExecuteAsync(
            "dbo.RemoveLike",
            new { UserId = userId, PostId = postId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task MarkNotificationsReadAsync(int userId)
    {
        using var con = _db.Create();
        await con.ExecuteAsync(
            "dbo.MarkNotificationsAsRead",
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }
}
