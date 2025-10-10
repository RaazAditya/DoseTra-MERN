import connectDB from "./db/database.js";
import { app } from "./app.js";
import { initSocket } from "./sockets/socket.js";
import { startNotificationJob } from "./services/notificationService.js";
import http from "http";



export default async function startServer() {
  try {
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);
    startNotificationJob(); // start cron job

    server.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  } catch (err) {
    console.error("Server start failed:", err);
    process.exit(1);
  }
}
