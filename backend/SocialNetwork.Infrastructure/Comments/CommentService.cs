using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using SocialNetwork.Application.Comments;
using SocialNetwork.Infrastructure.Data;
using System.Data;

namespace SocialNetwork.Infrastructure.Comments
{
    public sealed class CommentService : ICommentService
    {
        private readonly ISqlConnectionFactory _db;
        public CommentService(ISqlConnectionFactory db) => _db = db;

        public async Task AddAsync(int userId, int postId, AddCommentRequest req)
        {
            using var con = _db.Create();
            await con.ExecuteAsync(
                "dbo.AddComment",
                new
                {
                    UserId = userId,
                    PostId = postId,
                    Text = req.CommentText
                },
                commandType: CommandType.StoredProcedure);
        }


        public async Task DeleteAsync(int userId, int commentId)
        {
            using var con = _db.Create();
            await con.ExecuteAsync(
                "dbo.DeleteComment",
                new { CommentId = commentId, UserId = userId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IReadOnlyList<CommentDto>> GetForPostAsync(int postId)
        {
            using var con = _db.Create();
            var comments = await con.QueryAsync<CommentDto>(
                "dbo.GetCommentsForPost",
                new { PostId = postId },
                commandType: CommandType.StoredProcedure);

            return comments.AsList();
        }
    }
}
