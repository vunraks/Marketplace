using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using VaultTrade.API.Extensions;

namespace VaultTrade.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation-{conversationId}");
    }

    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation-{conversationId}");
    }

    public async Task SendTyping(string conversationId)
    {
        var userId = Context.User?.GetUserId().ToString();
        await Clients.OthersInGroup($"conversation-{conversationId}")
            .SendAsync("UserTyping", conversationId, userId);
    }
}

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.IsAuthenticated == true)
        {
            var userId = Context.User.GetUserId();
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        }

        await base.OnConnectedAsync();
    }
}
