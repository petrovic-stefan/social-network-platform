using Dapper;
using SocialNetwork.Application.Users;
using SocialNetwork.Infrastructure.Data;
using System.Data;

namespace SocialNetwork.Infrastructure.Users
{
    public sealed class UserService : IUserService
    {
        private readonly ISqlConnectionFactory _db;
        public UserService(ISqlConnectionFactory db) => _db = db;

        public async Task UpdateProfilePicAsync(int userId, string profilePic)
        {
            using var con = _db.Create();

            await con.ExecuteAsync(
                """
                UPDATE USERS
                SET PROFILE_PIC = @ProfilePic,
                    UPDATED_AT = GETDATE()
                WHERE USERS_ID = @UserId
                """,
                new
                {
                    UserId = userId,
                    ProfilePic = profilePic
                });
        }

        public async Task UpdateMeAsync(int userId, UpdateMeRequest request)
        {
            using var con = _db.Create();

            var firstName = (request.FirstName ?? string.Empty).Trim();
            var lastName = (request.LastName ?? string.Empty).Trim();
            var gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim();
            var bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();

            if (string.IsNullOrWhiteSpace(firstName))
                throw new ArgumentException("First name is required.");

            if (string.IsNullOrWhiteSpace(lastName))
                throw new ArgumentException("Last name is required.");

            if (firstName.Length > 40)
                throw new ArgumentException("First name must be at most 40 characters.");

            if (lastName.Length > 60)
                throw new ArgumentException("Last name must be at most 60 characters.");

            if (gender is not null && gender is not ("Male" or "Female" or "Other"))
                throw new ArgumentException("Gender must be Male, Female or Other.");

            if (bio is not null && bio.Length > 160)
                throw new ArgumentException("Bio must be at most 160 characters.");

            await con.ExecuteAsync(
                """
                UPDATE USERS
                SET FIRST_NAME = @FirstName,
                    LAST_NAME = @LastName,
                    GENDER = @Gender,
                    BIO = @Bio,
                    UPDATED_AT = GETDATE()
                WHERE USERS_ID = @UserId
                """,
                new
                {
                    UserId = userId,
                    FirstName = firstName,
                    LastName = lastName,
                    Gender = gender,
                    Bio = bio
                });
        }

        public async Task<MyProfileDto> GetMeAsync(int userId)
        {
            using var con = _db.Create();

            return await con.QuerySingleAsync<MyProfileDto>(
                """
                SELECT
                    USERS_ID    AS Users_Id,
                    USERNAME    AS Username,
                    EMAIL       AS Email,
                    FIRST_NAME  AS First_Name,
                    LAST_NAME   AS Last_Name,
                    GENDER      AS Gender,
                    BIO         AS Bio,
                    PROFILE_PIC AS Profile_Pic
                FROM USERS
                WHERE USERS_ID = @UserId
                """,
                new { UserId = userId });
        }

        public async Task<UserProfileDto?> GetProfileByUsernameAsync(int viewerId, string username)
        {
            using var con = _db.Create();

            return await con.QuerySingleOrDefaultAsync<UserProfileDto>(
                """
                SELECT
                    u.USERS_ID AS UserId,
                    u.USERNAME AS Username,
                    u.PROFILE_PIC AS ProfilePic,

                    (SELECT COUNT(1)
                     FROM USER_RELATIONSHIPS r
                     WHERE r.TO_USERS_ID = u.USERS_ID
                       AND r.STATUS = 'following') AS FollowersCount,

                    (SELECT COUNT(1)
                     FROM USER_RELATIONSHIPS r
                     WHERE r.FROM_USERS_ID = u.USERS_ID
                       AND r.STATUS = 'following') AS FollowingCount,

                    (SELECT COUNT(1)
                     FROM POSTS p
                     WHERE p.USERS_ID = u.USERS_ID) AS PostsCount,

                    CASE WHEN EXISTS (
                        SELECT 1
                        FROM USER_RELATIONSHIPS r2
                        WHERE r2.FROM_USERS_ID = @ViewerId
                          AND r2.TO_USERS_ID = u.USERS_ID
                          AND r2.STATUS = 'following'
                    )
                    THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS IsFollowedByMe

                FROM USERS u
                WHERE u.USERNAME = @Username
                """,
                new { ViewerId = viewerId, Username = username }
            );
        }

        public async Task<IReadOnlyList<SearchUserDto>> SearchAsync(int viewerId, string query, int take)
        {
            using var con = _db.Create();

            var rows = await con.QueryAsync<SearchUserDto>(
                """
                SELECT TOP (@Take)
                    u.USERS_ID AS UserId,
                    u.USERNAME AS Username,
                    u.FIRST_NAME AS FirstName,
                    u.LAST_NAME AS LastName,
                    u.PROFILE_PIC AS ProfilePic,

                    CASE WHEN EXISTS (
                        SELECT 1
                        FROM USER_RELATIONSHIPS r
                        WHERE r.FROM_USERS_ID = @ViewerId
                          AND r.TO_USERS_ID = u.USERS_ID
                          AND r.STATUS = 'following'
                    )
                    THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS IsFollowedByMe

                FROM USERS u
                WHERE
                    u.USERS_ID <> @ViewerId
                    AND (
                        u.USERNAME LIKE '%' + @Query + '%'
                        OR u.FIRST_NAME LIKE '%' + @Query + '%'
                        OR u.LAST_NAME LIKE '%' + @Query + '%'
                    )
                ORDER BY
                    CASE
                        WHEN u.USERNAME = @Query THEN 0
                        WHEN u.USERNAME LIKE @Query + '%' THEN 1
                        WHEN u.FIRST_NAME LIKE @Query + '%' THEN 2
                        WHEN u.LAST_NAME LIKE @Query + '%' THEN 3
                        ELSE 4
                    END,
                    u.USERNAME ASC
                """,
                new
                {
                    ViewerId = viewerId,
                    Query = query,
                    Take = take
                });

            return rows.AsList();
        }
    }
}