using System.Security.Claims;

namespace SocialNetwork.API.Auth
{
    public static class ClaimsPrincipalExtensions
    {
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.Parse(id!);
        }

        public static string GetUsername(this ClaimsPrincipal user)
            => user.FindFirst("username")?.Value
                ?? user.FindFirstValue(ClaimTypes.Name)
                ?? user.Identity?.Name
                ?? "unknown";
    }
}
