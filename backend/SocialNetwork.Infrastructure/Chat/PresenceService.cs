using Dapper;
using SocialNetwork.Application.Interfaces;
using SocialNetwork.Infrastructure.Data;

namespace SocialNetwork.Infrastructure.Chat;

public interface IPresenceService
{
    Task<int[]> GetPeersAsync(int userId);
}

public sealed class PresenceService : IPresenceService
{
    private readonly ISqlConnectionFactory _db;
    public PresenceService(ISqlConnectionFactory db) => _db = db;

    public async Task<int[]> GetPeersAsync(int userId)
    {
        using var con = _db.Create();

        var peers = await con.QueryAsync<int>(
            "dbo.GetChatPeers",
            new { UserId = userId },
            commandType: System.Data.CommandType.StoredProcedure);

        return peers.Distinct().ToArray();
    }
}
