using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using SocialNetwork.Infrastructure.Chat;

namespace SocialNetwork.API.Hubs;

[Authorize]
public sealed class ChatHub : Hub
{
    // userId -> set(connectionIds)
    private static readonly ConcurrentDictionary<int, ConcurrentDictionary<string, byte>> _connections = new();
    private static readonly ConcurrentDictionary<int, DateTime> _lastSeen = new();
    private static readonly ConcurrentDictionary<(int fromUserId, int peerUserId, int conversationId), DateTime> _typingLast = new();

    private readonly IPresenceService _presence;

    public ChatHub(IPresenceService presence)
    {
        _presence = presence;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserIdOrThrow();

        
        var set = _connections.GetOrAdd(userId, _ => new ConcurrentDictionary<string, byte>());
        set.TryAdd(Context.ConnectionId, 0);

        
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");

        
        var peers = await _presence.GetPeersAsync(userId);
        foreach (var peerId in peers)
        {
            await Clients.Group($"user:{peerId}")
                .SendAsync("chat:presence", new
                {
                    userId,
                    isOnline = true,
                    lastSeen = (DateTime?)null
                });
        }

      
        var onlinePeers = peers
            .Where(pid => _connections.TryGetValue(pid, out var s) && !s.IsEmpty)
            .ToArray();

        await Clients.Caller.SendAsync("chat:onlinePeers", new
        {
            userId,
            peers = onlinePeers
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = TryGetUserId();
        if (userId is null)
        {
            await base.OnDisconnectedAsync(exception);
            return;
        }

       
        if (_connections.TryGetValue(userId.Value, out var set))
        {
            set.TryRemove(Context.ConnectionId, out _);

            
            if (set.IsEmpty)
            {
                var now = DateTime.UtcNow;
                _lastSeen[userId.Value] = now;

                var peers = await _presence.GetPeersAsync(userId.Value);
                foreach (var peerId in peers)
                {
                    await Clients.Group($"user:{peerId}")
                        .SendAsync("chat:presence", new
                        {
                            userId = userId.Value,
                            isOnline = false,
                            lastSeen = now
                        });
                }
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    
    public Task Ping()
        => Clients.Caller.SendAsync("chat:pong", new { ts = DateTime.UtcNow });

    private int GetUserIdOrThrow()
    {
        
        var idStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? Context.User?.FindFirstValue("sub"); 

        if (!int.TryParse(idStr, out var userId) || userId <= 0)
            throw new HubException("Unauthorized");

        return userId;
    }

    private int? TryGetUserId()
    {
        var idStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? Context.User?.FindFirstValue("sub");

        if (!int.TryParse(idStr, out var userId) || userId <= 0)
            return null;

        return userId;
    }
    public async Task Typing(int conversationId, int peerUserId, bool isTyping)
    {
        var fromUserId = GetUserIdOrThrow();

      
        await Clients.Group($"user:{peerUserId}")
            .SendAsync("chat:typing", new
            {
                conversationId,
                fromUserId,
                isTyping,
                at = DateTime.UtcNow
            });
    }

}
