using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Users
{
    public sealed record UpdateMeRequest(
        string FirstName,
        string LastName,
        string? Gender,
        string? Bio
    );
}
