using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Chat
{
    public sealed class InboxItemDto
    {
        public int ConversationId { get; set; }
        public int PeerUserId { get; set; }
        public string PeerUsername { get; set; } = "";
        public string? PeerProfilePic { get; set; }

        public string? LastMessageText { get; set; }
        public DateTime? LastSentAt { get; set; }

        public int UnreadCount { get; set; }
    }

}
