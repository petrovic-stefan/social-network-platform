namespace SocialNetwork.API.Realtime
{
    public interface INotificationRealtime
    {
        Task PushAsync(int toUserId, object payload);
    }
}
