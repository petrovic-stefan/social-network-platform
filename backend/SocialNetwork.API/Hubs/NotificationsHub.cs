using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;
using SocialNetwork.API.Auth;

namespace SocialNetwork.API.Hubs
{
    [Authorize]
    public class NotificationsHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User!.GetUserId();
            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(userId));
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User!.GetUserId();
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(userId));
            await base.OnDisconnectedAsync(exception);
        }

        public static string GroupName(int userId) => $"user:{userId}";
    }
}
