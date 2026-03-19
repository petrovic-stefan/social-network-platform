using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Notifications
{
    public interface INotificationService
    {
        Task<IReadOnlyList<NotificationDto>> GetAsync(int userId, int take);
        Task<UnreadCountResponse> GetUnreadCountAsync(int userId);
        Task MarkAllReadAsync(int userId);
    }
}
