using Dapper;
using SocialNetwork.Application.Posts;
using SocialNetwork.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Infrastructure.Posts
{
    public sealed class PostService : IPostService
    {
        private readonly ISqlConnectionFactory _db;
        public PostService(ISqlConnectionFactory db) => _db = db;

        public async Task<CreatePostResponse> CreateAsync(int userId, CreatePostRequest req)
        {
            using var con = _db.Create();

            var newId = await con.ExecuteScalarAsync<decimal>( // SCOPE_IDENTITY vraća decimal
                "dbo.AddPost",
                new { UserId = userId, req.PostText, req.PostImg },
                commandType: CommandType.StoredProcedure);

            return new CreatePostResponse((int)newId);
        }

        public async Task DeleteAsync(int userId, int postId)
        {
            using var con = _db.Create();
            await con.ExecuteAsync(
                "dbo.DeletePostSoft",
                new { PostId = postId, UserId = userId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IReadOnlyList<FeedPostDto>> GetFeedAsync(int userId, int take)
        {
            using var con = _db.Create();
            var posts = await con.QueryAsync<FeedPostDto>(
                "dbo.GetFeed",
                new { UserId = userId, Take = take },
                commandType: CommandType.StoredProcedure);

            return posts.AsList();
        }
        public async Task<IEnumerable<PostDto>> GetFeedAsync(int viewerId, int take, DateTime? before)
        {
            using var con = _db.Create();

            var items = await con.QueryAsync<PostDto>(
                "dbo.GetFeed",
                new { ViewerId = viewerId, Take = take, Before = before },
                commandType: CommandType.StoredProcedure
            );

            return items;
        }
        public async Task<PostDto?> GetByIdAsync(int viewerId, int postId)
        {
            using var con = _db.Create();

            return await con.QuerySingleOrDefaultAsync<PostDto>(
                """
        SELECT
            p.POSTS_ID        AS postId,
            p.USERS_ID        AS userId,
            u.USERNAME        AS username,
            u.PROFILE_PIC     AS profilePic,
            p.POST_TEXT       AS content,
            p.POST_IMG        AS postImg,
            p.POST_CREATED_AT AS createdAt,

            (SELECT COUNT(1) 
             FROM LIKES l 
             WHERE l.POSTS_ID = p.POSTS_ID) AS likeCount,

            (SELECT COUNT(1) 
             FROM COMMENTS c 
             WHERE c.POSTS_ID = p.POSTS_ID) AS commentCount,

            CASE WHEN EXISTS (
                SELECT 1 
                FROM LIKES l2
                WHERE l2.POSTS_ID = p.POSTS_ID
                  AND l2.USERS_ID = @ViewerId
            )
            THEN CAST(1 AS bit)
            ELSE CAST(0 AS bit)
            END AS isLikedByMe

        FROM POSTS p
        INNER JOIN USERS u ON u.USERS_ID = p.USERS_ID
        WHERE p.POSTS_ID = @PostId
        AND ISNULL(p.IS_DELETED, 0) = 0
        """,
                new { ViewerId = viewerId, PostId = postId }
            );
        }
        public async Task<IReadOnlyList<PostDto>> GetByUsernameAsync(int viewerId, string username, int take, DateTime? before)
        {
            using var con = _db.Create();

            var items = await con.QueryAsync<PostDto>(
                """
        SELECT TOP (@Take)
            p.POSTS_ID        AS postId,
            p.USERS_ID        AS userId,
            u.USERNAME        AS username,
            u.PROFILE_PIC     AS profilePic,
            p.POST_TEXT       AS content,
            p.POST_IMG        AS postImg,
            p.POST_CREATED_AT AS createdAt,

            (SELECT COUNT(1) FROM LIKES l WHERE l.POSTS_ID = p.POSTS_ID) AS likeCount,
            (SELECT COUNT(1) FROM COMMENTS c WHERE c.POSTS_ID = p.POSTS_ID) AS commentCount,

            CASE WHEN EXISTS (
                SELECT 1 FROM LIKES l2
                WHERE l2.POSTS_ID = p.POSTS_ID AND l2.USERS_ID = @ViewerId
            ) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS isLikedByMe

        FROM POSTS p
        JOIN USERS u ON u.USERS_ID = p.USERS_ID
        WHERE u.USERNAME = @Username
          AND ISNULL(p.IS_DELETED, 0) = 0  
          AND (@Before IS NULL OR p.POST_CREATED_AT < @Before)
        ORDER BY p.POST_CREATED_AT DESC
        """,
                new { ViewerId = viewerId, Username = username, Take = take, Before = before }
            );

            return items.AsList();
        }
        public async Task UpdateAsync(int userId, int postId, UpdatePostRequest req)
        {
            using var con = _db.Create();

            var postText = (req.PostText ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(postText))
                throw new ArgumentException("Post text is required.");

            if (postText.Length > 2000)
                throw new ArgumentException("Post text is too long.");

            var affected = await con.ExecuteAsync(
                """
        UPDATE POSTS
        SET POST_TEXT = @PostText
        WHERE POSTS_ID = @PostId
          AND USERS_ID = @UserId
          AND ISNULL(IS_DELETED, 0) = 0
        """,
                new
                {
                    PostId = postId,
                    UserId = userId,
                    PostText = postText
                });

            if (affected == 0)
                throw new KeyNotFoundException("Post not found or access denied.");
        }
    }
}
