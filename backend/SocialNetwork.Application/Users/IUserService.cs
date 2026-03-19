using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialNetwork.Application.Users
{
    public interface IUserService
    {
        Task UpdateProfilePicAsync(int userId, string profilePic);
        Task UpdateMeAsync(int userId, UpdateMeRequest request);
        Task<MyProfileDto> GetMeAsync(int userId);
        Task<UserProfileDto?> GetProfileByUsernameAsync(int viewerId, string username);
        Task<IReadOnlyList<SearchUserDto>> SearchAsync(int viewerId, string query, int take);
    }
}
