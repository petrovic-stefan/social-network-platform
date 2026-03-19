using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Auth
{
    public sealed record RegisterRequest(
    string FirstName,
    string LastName,
    string Email,
    string Username,
    string Password,
    string Gender
);
}
