// backend/sockets/socketServer.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken"; // for token verification

let io;
const connectedUsers = new Map(); // userId -> socketId

// Utility to verify JWT token and extract userId
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return decoded.id;
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return null;
  }
};

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔗 Client connected:", socket.id);

    // Extract token from headers
    const authHeader = socket.handshake.headers.authorization;
    let userIdFromToken = null;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      userIdFromToken = verifyToken(token);
      if (userIdFromToken) {
        connectedUsers.set(userIdFromToken, socket.id);
        console.log(`✅ Registered user ${userIdFromToken} via token with socket ${socket.id}`);
      } else {
        console.log(`❌ Authentication failed for socket ${socket.id}`);
        socket.disconnect(true); // disconnect unauthenticated socket
        return;
      }
    } else {
      console.log(`❌ No token provided for socket ${socket.id}`);
      socket.disconnect(true);
      return;
    }

    // Optional: handle additional registration from client (fallback)
    socket.on("register", ({ userId }) => {
      if (userId && !connectedUsers.has(userId)) {
        connectedUsers.set(userId, socket.id);
        console.log(`✅ Registered user ${userId} with socket ${socket.id} (via manual emit)`);
      }
    });

    // Example: emit notifications to a specific user
    socket.on("sendNotification", ({ toUserId, message }) => {
      const targetSocketId = connectedUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("notification", { message });
        console.log(`📨 Sent notification to user ${toUserId}`);
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, id] of connectedUsers.entries()) {
        if (id === socket.id) {
          connectedUsers.delete(userId);
          console.log(`❌ User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

export function getConnectedUsers() {
  return connectedUsers;
}
