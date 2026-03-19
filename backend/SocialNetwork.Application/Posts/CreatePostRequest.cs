using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Posts
{
    public sealed record CreatePostRequest(string PostText, string? PostImg);
}
