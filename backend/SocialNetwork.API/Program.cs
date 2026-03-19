using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SocialNetwork.API.Hubs;
using SocialNetwork.API.Middleware;
using SocialNetwork.API.Services;
using SocialNetwork.Application.Auth;
using SocialNetwork.Application.Chat;
using SocialNetwork.Application.Comments;
using SocialNetwork.Application.Interfaces;
using SocialNetwork.Application.Notifications;
using SocialNetwork.Application.Posts;
using SocialNetwork.Application.Users;
using SocialNetwork.Infrastructure.Auth;
using SocialNetwork.Infrastructure.Chat;
using SocialNetwork.Infrastructure.Comments;
using SocialNetwork.Infrastructure.Data;
using SocialNetwork.Infrastructure.Middleware;
using SocialNetwork.Infrastructure.Notifications;
using SocialNetwork.Infrastructure.Posts;
using SocialNetwork.Infrastructure.Services;
using SocialNetwork.Infrastructure.Users;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
builder.Services.AddScoped<ISocialActionsService, SocialActionsService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["Jwt:Key"]!;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/hubs/notifications") || path.StartsWithSegments("/hubs/chat")))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "SocialNetwork.API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Unesi: Bearer {tvoj_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSignalR();
builder.Services.AddSingleton<SocialNetwork.API.Realtime.INotificationRealtime, SocialNetwork.API.Realtime.NotificationRealtime>();
builder.Services.AddScoped<SocialNetwork.Application.Posts.IPostOwnerQuery, SocialNetwork.Infrastructure.Posts.PostOwnerQuery>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("cors", p =>
        p.WithOrigins("http://localhost:5173", "https://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials());
});
builder.Services.AddScoped<IUserBanService, UserBanService>();
builder.Services.AddScoped<BanMiddleware>();
builder.Services.AddScoped<ApiExceptionMiddleware>();
builder.Services.AddScoped<SocialNetwork.Infrastructure.Chat.IPresenceService, SocialNetwork.Infrastructure.Chat.PresenceService>();
builder.Services.AddScoped<FileStorage>();



var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ApiExceptionMiddleware>();


app.UseDefaultFiles();
app.UseStaticFiles();


app.UseCors("cors");


app.UseAuthentication();
app.UseAuthorization();


app.UseMiddleware<BanMiddleware>();


app.MapControllers();
app.MapHub<NotificationsHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
