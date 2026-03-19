using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Chat
{
    public interface IChatService
    {
        Task<int> GetOrCreateDmConversationAsync(int userId, int otherUserId);
        Task<int> SendMessageAsync(int conversationId, int fromUserId, string text);
        Task<IReadOnlyList<MessageDto>> GetMessagesAsync(int conversationId, int userId, int take);
        Task<IReadOnlyList<InboxItemDto>> GetInboxAsync(int userId);
        Task MarkReadAsync(int conversationId, int userId);
        Task<int?> GetDmPeerUserAsync(int conversationId, int userId);
        Task DeleteMessageAsync(int messageId, int userId, bool isAdmin);
        Task<int> GetPeerUserIdAsync(int conversationId, int userId);
        Task<int> MarkDeliveredAsync(int conversationId, int userId);


    }
}
