import { io } from "socket.io-client";

let socket;

export const initSocket = (userId, token, onNotification) => {
  if (socket) return socket;

  socket = io("http://localhost:7000", {
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("register", { userId });
  });

  socket.on("notification", (notification) => {
    console.log(" New notification:", notification);
    onNotification(notification);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};
