using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Posts
{
    public interface IPostService
    {
        Task<CreatePostResponse> CreateAsync(int userId, CreatePostRequest req);
        Task DeleteAsync(int userId, int postId);
        Task UpdateAsync(int userId, int postId, UpdatePostRequest req);
        Task<IReadOnlyList<FeedPostDto>> GetFeedAsync(int userId, int take);
        Task<PostDto?> GetByIdAsync(int viewerId, int postId);
        Task<IEnumerable<PostDto>> GetFeedAsync(int viewerId, int take, DateTime? before);
        Task<IReadOnlyList<PostDto>> GetByUsernameAsync(int viewerId, string username, int take, DateTime? before);
    }
}
