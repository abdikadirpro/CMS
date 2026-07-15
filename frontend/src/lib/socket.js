import { io } from "socket.io-client";

// Same story as baseApi.js: dev relies on Vite's proxy for a relative URL, production needs the
// deployed backend's real origin.
const SOCKET_URL = import.meta.env.VITE_API_URL || "/";

let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, { path: "/socket.io", auth: { token }, transports: ["websocket", "polling"] });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
