import * as signalR from "@microsoft/signalr";

const HUB_URL = "https://localhost:7248/hubs/notifications";
const TOKEN_KEY = "sn_access_token";

export function createNotificationsConnection() {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem(TOKEN_KEY) ?? "",
    })
    .withAutomaticReconnect([0, 1000, 3000, 8000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return conn;
}
