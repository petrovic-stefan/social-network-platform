using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Infrastructure.Auth
{
    public interface IJwtTokenService
    {
        string CreateToken(int userId, string username, string role);
    }
}
