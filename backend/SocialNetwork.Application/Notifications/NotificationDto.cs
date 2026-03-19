using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Notifications
{
    using System;
    public sealed class NotificationDto
    {
        public int NotificationId { get; set; }
        public int FromUserId { get; set; }
        public string FromUsername { get; set; }
        public int ToUserId { get; set; }
        public int? PostId { get; set; }
        public string Text { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
