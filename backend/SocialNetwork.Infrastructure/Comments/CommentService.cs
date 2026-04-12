using Dapper;
using SocialNetwork.Application.Comments;
using SocialNetwork.Infrastructure.Data;
using System.Data;

namespace SocialNetwork.Infrastructure.Comments
{
    public sealed class CommentService : ICommentService
    {
        private readonly ISqlConnectionFactory _db;

        public CommentService(ISqlConnectionFactory db)
        {
            _db = db;
        }

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

        public async Task<bool> CanDeleteAsync(int userId, int commentId)
        {
            using var con = _db.Create();

            var count = await con.ExecuteScalarAsync<int>(
                """
                SELECT COUNT(1)
                FROM COMMENTS c
                INNER JOIN POSTS p ON p.POSTS_ID = c.POSTS_ID
                WHERE c.COMMENTS_ID = @CommentId
                  AND (
                        c.USERS_ID = @UserId
                        OR p.USERS_ID = @UserId
                      )
                """,
                new
                {
                    CommentId = commentId,
                    UserId = userId
                });

            return count > 0;
        }

        public async Task DeleteAsync(int userId, int commentId)
        {
            using var con = _db.Create();

            var canDelete = await CanDeleteAsync(userId, commentId);
            if (!canDelete)
                throw new UnauthorizedAccessException("You are not allowed to delete this comment.");

            await con.ExecuteAsync(
                """
                DELETE FROM COMMENTS
                WHERE COMMENTS_ID = @CommentId
                """,
                new { CommentId = commentId });
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