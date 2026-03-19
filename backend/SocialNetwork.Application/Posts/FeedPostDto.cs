using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Posts
{
    public sealed record FeedPostDto(
    int Posts_Id,
    string Post_Text,
    string? Post_Img,
    DateTime Post_Created_At,
    int Users_Id,
    string Username,
    string? Profile_Pic
    );
}
