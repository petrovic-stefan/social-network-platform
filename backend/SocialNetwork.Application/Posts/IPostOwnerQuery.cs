using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Posts
{
    public interface IPostOwnerQuery
    {
        Task<int> GetOwnerIdAsync(int postId);
    }
}
