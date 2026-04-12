using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Comments
{
    public interface ICommentService
    {
        Task AddAsync(int userId, int postId, AddCommentRequest req);
        Task DeleteAsync(int userId, int commentId);
        Task<IReadOnlyList<CommentDto>> GetForPostAsync(int postId);
        Task<bool> CanDeleteAsync(int userId, int commentId);
    }
}
