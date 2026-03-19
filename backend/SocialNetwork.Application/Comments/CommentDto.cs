using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Comments
{
    public sealed class CommentDto
    {
        public int CommentId { get; init; }
        public int PostId { get; init; }
        public int UserId { get; init; }
        public string Username { get; init; } = "";
        public string? ProfilePic { get; init; }
        public string CommentText { get; init; } = "";
        public DateTime CreatedAt { get; init; }
    }
}
