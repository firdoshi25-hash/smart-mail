import { io } from "socket.io-client";

export function connectSocket(token) {
  return io(import.meta.env.VITE_SOCKET_URL || "http://localhost:9000", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
  });
}