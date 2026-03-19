using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Auth
{
    public sealed record AuthResponse(string AccessToken, int UserId, string Username);
}
