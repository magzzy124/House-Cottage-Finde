using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HouseCottageFinder.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task JoinProperty(int propertyId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"property_{propertyId}");
    }

    public async Task LeaveProperty(int propertyId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"property_{propertyId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
