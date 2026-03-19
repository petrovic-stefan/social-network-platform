using Dapper;
using SocialNetwork.Application.Posts;
using SocialNetwork.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Infrastructure.Posts
{
    public sealed class PostOwnerQuery : IPostOwnerQuery
    {
        private readonly ISqlConnectionFactory _db;
        public PostOwnerQuery(ISqlConnectionFactory db) => _db = db;

        public async Task<int> GetOwnerIdAsync(int postId)
        {
            using var con = _db.Create();
            return await con.ExecuteScalarAsync<int>(
                "SELECT USERS_ID FROM POSTS WHERE POSTS_ID = @PostId",
                new { PostId = postId });
        }
    }
}
