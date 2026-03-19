using Dapper;
using SocialNetwork.Application.Chat;
using SocialNetwork.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Infrastructure.Chat
{
    public sealed class ChatService : IChatService
    {
        private readonly ISqlConnectionFactory _db;
        public ChatService(ISqlConnectionFactory db) => _db = db;

        public async Task<int> GetOrCreateDmConversationAsync(int userId, int otherUserId)
        {
            using var con = _db.Create();
            return await con.QuerySingleAsync<int>(
                "dbo.GetOrCreateDmConversation",
                new { UserId = userId, OtherUserId = otherUserId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> SendMessageAsync(int conversationId, int fromUserId, string text)
        {
            using var con = _db.Create();
            return await con.QuerySingleAsync<int>(
                "dbo.SendMessageToConversation",
                new { ConversationId = conversationId, FromUserId = fromUserId, Text = text },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IReadOnlyList<MessageDto>> GetMessagesAsync(int conversationId, int userId, int take)
        {
            using var con = _db.Create();
            var rows = await con.QueryAsync<MessageDto>(
                "dbo.GetMessagesByConversation",
                new { ConversationId = conversationId, UserId = userId, Take = take },
                commandType: CommandType.StoredProcedure);
            return rows.ToList();
        }

        public async Task<IReadOnlyList<InboxItemDto>> GetInboxAsync(int userId)
        {
            using var con = _db.Create();
            var items = await con.QueryAsync<InboxItemDto>(
                "dbo.GetInbox",
                new { UserId = userId },
                commandType: System.Data.CommandType.StoredProcedure);

            return items.AsList();
        }


        public async Task MarkReadAsync(int conversationId, int userId)
        {
            using var con = _db.Create();
            await con.ExecuteAsync(
                "dbo.MarkConversationRead",
                new { ConversationId = conversationId, UserId = userId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int?> GetDmPeerUserAsync(int conversationId, int userId)
        {
            using var con = _db.Create();
            const string sql = """
            SELECT
              CASE
                WHEN IS_GROUP = 0 AND DM_USER1_ID = @UserId THEN DM_USER2_ID
                WHEN IS_GROUP = 0 AND DM_USER2_ID = @UserId THEN DM_USER1_ID
                ELSE NULL
              END AS PeerUserId
            FROM dbo.CONVERSATIONS
            WHERE CONVERSATION_ID = @ConversationId
            """;

            return await con.QuerySingleOrDefaultAsync<int?>(sql, new { ConversationId = conversationId, UserId = userId });
        }
        public async Task DeleteMessageAsync(int messageId, int userId, bool isAdmin)
        {
            using var con = _db.Create();
            await con.ExecuteAsync(
                "dbo.DeleteMessage",
                new { MessageId = messageId, UserId = userId, IsAdmin = isAdmin },
                commandType: CommandType.StoredProcedure);
        }
        public async Task<int> GetPeerUserIdAsync(int conversationId, int userId)
        {
            using var con = _db.Create();
            return await con.ExecuteScalarAsync<int>(
                "dbo.GetConversationPeer",
                new { ConversationId = conversationId, UserId = userId },
                commandType: CommandType.StoredProcedure);
        }
        public async Task<int> MarkDeliveredAsync(int conversationId, int userId)
        {
            using var con = _db.Create();
            return await con.ExecuteScalarAsync<int>(
                "dbo.MarkConversationDelivered",
                new { ConversationId = conversationId, UserId = userId },
                commandType: CommandType.StoredProcedure);
        }

    }
}
