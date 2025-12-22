import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let socket = null;

/**
 * Initialize socket connection
 */
export function initSocket() {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("🔌 Socket connection error:", error.message);
  });

  return socket;
}

/**
 * Get socket instance
 */
export function getSocket() {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

/**
 * Connect socket
 */
export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/**
 * Register user with socket
 */
export function registerSocket(userId, username) {
  const s = getSocket();
  s.emit("register", { userId, username });
}

export default {
  initSocket,
  getSocket,
  connectSocket,
  disconnectSocket,
  registerSocket,
};
