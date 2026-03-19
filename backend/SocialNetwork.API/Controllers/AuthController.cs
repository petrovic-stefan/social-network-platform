using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Application.Auth;

namespace SocialNetwork.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        => Ok(await _auth.RegisterAsync(req));

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
        => Ok(await _auth.LoginAsync(req));
}
