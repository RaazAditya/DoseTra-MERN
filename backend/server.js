import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// Dynamically import after env is ready
const { default: startServer } = await import("./start.js");
startServer();
