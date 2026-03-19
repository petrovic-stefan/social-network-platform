using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Users
{
    public sealed record UserProfileDto(
    int UserId,
    string Username,
    string? ProfilePic,
    int FollowersCount,
    int FollowingCount,
    int PostsCount,
    bool IsFollowedByMe
);
}
