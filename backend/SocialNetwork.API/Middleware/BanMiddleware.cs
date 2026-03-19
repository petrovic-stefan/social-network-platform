using SocialNetwork.API.Auth;
using SocialNetwork.Infrastructure.Middleware;

namespace SocialNetwork.API.Middleware
{
    public sealed class BanMiddleware : IMiddleware
    {
        private readonly IUserBanService _ban;

        public BanMiddleware(IUserBanService ban)
        {
            _ban = ban;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var path = context.Request.Path.Value?.ToLower() ?? "";

            if (path.StartsWith("/api/auth") ||
                path.StartsWith("/swagger") ||
                path.StartsWith("/hubs"))
            {
                await next(context);
                return;
            }

            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.GetUserId();

                if (await _ban.IsBannedAsync(userId))
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "Account is banned by administrator."
                    });
                    return;
                }
            }

            await next(context);
        }
    }
}
