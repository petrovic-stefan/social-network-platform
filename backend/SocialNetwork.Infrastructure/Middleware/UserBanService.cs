using Dapper;
using SocialNetwork.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Infrastructure.Middleware
{
    public sealed class UserBanService : IUserBanService
    {
        private readonly ISqlConnectionFactory _db;
        public UserBanService(ISqlConnectionFactory db) => _db = db;

        public async Task<bool> IsBannedAsync(int userId)
        {
            using var con = _db.Create();
            return await con.ExecuteScalarAsync<bool>(
                "SELECT IS_BANNED FROM dbo.USERS WHERE USERS_ID = @userId",
                new { userId }
            );
        }
    }
}
