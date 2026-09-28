using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HouseCottageFinder.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task JoinConversation(int propertyId, int otherUserId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ConversationGroup(propertyId, otherUserId));
    }

    public async Task LeaveConversation(int propertyId, int otherUserId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ConversationGroup(propertyId, otherUserId));
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    private string ConversationGroup(int propertyId, int otherUserId)
    {
        var me = int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var min = Math.Min(me, otherUserId);
        var max = Math.Max(me, otherUserId);
        return $"conv_{propertyId}_{min}_{max}";
    }
}
