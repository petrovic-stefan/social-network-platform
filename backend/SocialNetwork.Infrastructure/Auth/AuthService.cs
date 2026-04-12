using Dapper;
using SocialNetwork.Application.Auth;
using SocialNetwork.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Infrastructure.Auth
{
    public sealed class AuthService : IAuthService
    {
        private readonly ISqlConnectionFactory _db;
        private readonly IJwtTokenService _jwt;

        public AuthService(ISqlConnectionFactory db, IJwtTokenService jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
        {
            using var con = _db.Create();
            Console.WriteLine(">>> RegisterAsync HIT <<<");
            var exists = await con.ExecuteScalarAsync<int>(
                """
            SELECT COUNT(1)
            FROM USERS
            WHERE EMAIL = @Email OR USERNAME = @Username;
            """,
                new { req.Email, req.Username });

            if (exists > 0)
                throw new InvalidOperationException("Email or username already exists.");

            var salt = PasswordHasher.GenerateSalt();
            var hash = PasswordHasher.Hash(req.Password, salt);

            var newUserId = await con.ExecuteScalarAsync<int>(
                """
            INSERT INTO USERS (ROLES_ID, FIRST_NAME, LAST_NAME, EMAIL, USERNAME, GENDER, PROFILE_PIC, UPDATED_AT, USER_CREATED_AT, PASSWORD_HASH, PASSWORD_SALT)
            OUTPUT INSERTED.USERS_ID
            VALUES (1, @FirstName, @LastName, @Email, @Username, @Gender, 'default.png', GETDATE(), GETDATE(), @Hash, @Salt);
            """,
                new
                {
                    req.FirstName,
                    req.LastName,
                    req.Email,
                    req.Username,
                    req.Gender,
                    Hash = hash,
                    Salt = salt
                });

            var token = _jwt.CreateToken(newUserId, req.Username, role: "Korisnik");
            return new AuthResponse(token, newUserId, req.Username);
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest req)
        {
            using var con = _db.Create();

            var user = await con.QuerySingleOrDefaultAsync<UserAuthRow>(
                """
            SELECT USERS_ID, USERNAME, ROLES_ID, PASSWORD_HASH, PASSWORD_SALT
            FROM USERS
            WHERE EMAIL = @Email;
            """,
                new { req.Email });

            if (user is null)
                throw new UnauthorizedAccessException("Invalid credentials.");

            if (user.PASSWORD_HASH is null || user.PASSWORD_SALT is null)
                throw new InvalidOperationException("Password not migrated for this user.");

            var ok = PasswordHasher.Verify(req.Password, user.PASSWORD_SALT, user.PASSWORD_HASH);
            if (!ok)
                throw new UnauthorizedAccessException("Invalid credentials.");

            var roleName = user.ROLES_ID == 2 ? "Administrator" : "Korisnik";
            var token = _jwt.CreateToken(user.USERS_ID, user.USERNAME, roleName);

            return new AuthResponse(token, user.USERS_ID, user.USERNAME);
        }

        private sealed class UserAuthRow
        {
            public int USERS_ID { get; set; }
            public string USERNAME { get; set; } = "";
            public int ROLES_ID { get; set; }
            public byte[]? PASSWORD_HASH { get; set; }
            public byte[]? PASSWORD_SALT { get; set; }
        }
    }
}
