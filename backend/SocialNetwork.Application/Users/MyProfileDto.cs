using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Users
{
    public sealed record MyProfileDto(
        int Users_Id,
        string Username,
        string Email,
        string First_Name,
        string Last_Name,
        string? Gender,
        string? Bio,
        string? Profile_Pic
    );
}
