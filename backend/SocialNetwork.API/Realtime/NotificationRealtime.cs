using Microsoft.AspNetCore.SignalR;
using SocialNetwork.API.Hubs;
namespace SocialNetwork.API.Realtime
{
    public sealed class NotificationRealtime : INotificationRealtime
    {
        private readonly IHubContext<NotificationsHub> _hub;

        public NotificationRealtime(IHubContext<NotificationsHub> hub)
        {
            _hub = hub;
        }

        public Task PushAsync(int toUserId, object payload)
        {
            return _hub.Clients.Group(NotificationsHub.GroupName(toUserId))
                .SendAsync("notification", payload);
        }
    }
}
