using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Infrastructure.Auth
{
    public static class PasswordHasher
    {
        public static byte[] GenerateSalt(int size = 32)
        {
            var salt = new byte[size];
            RandomNumberGenerator.Fill(salt);
            return salt;
        }

        public static byte[] Hash(string password, byte[] salt)
        {
            // Hash = SHA256( salt + password )
            using var sha = SHA256.Create();
            var passBytes = Encoding.UTF8.GetBytes(password);

            var input = new byte[salt.Length + passBytes.Length];
            Buffer.BlockCopy(salt, 0, input, 0, salt.Length);
            Buffer.BlockCopy(passBytes, 0, input, salt.Length, passBytes.Length);

            return sha.ComputeHash(input);
        }

        public static bool Verify(string password, byte[] salt, byte[] expectedHash)
        {
            var actual = Hash(password, salt);
            return CryptographicOperations.FixedTimeEquals(actual, expectedHash);
        }
    }
}
