using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using SocialNetwork.Application.Notifications;
using SocialNetwork.Infrastructure.Data;
using System.Data;

namespace SocialNetwork.Infrastructure.Notifications
{
    public sealed class NotificationService : INotificationService
    {
        private readonly ISqlConnectionFactory _db;
        public NotificationService(ISqlConnectionFactory db) => _db = db;

        public async Task<IReadOnlyList<NotificationDto>> GetAsync(int userId, int take)
        {
            using var con = _db.Create();
            var rows = await con.QueryAsync<NotificationDto>(
                "dbo.GetNotifications",
                new { UserId = userId, Take = take },
                commandType: CommandType.StoredProcedure);

            return rows.AsList();
        }

        public async Task<UnreadCountResponse> GetUnreadCountAsync(int userId)
        {
            using var con = _db.Create();
            var count = await con.ExecuteScalarAsync<int>(
                "dbo.GetUnreadNotificationsCount",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);

            return new UnreadCountResponse(count);
        }

        public async Task MarkAllReadAsync(int userId)
        {
            using var con = _db.Create();
            await con.ExecuteAsync(
                "dbo.MarkNotificationsAsRead",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);
        }
    }
}
