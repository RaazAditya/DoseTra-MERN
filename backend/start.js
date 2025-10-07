import connectDB from "./db/database.js";
import { app } from "./app.js";

export default async function startServer() {
  try {
    await connectDB();

    app.listen(process.env.PORT || 3000, () => {
      console.log(`✅ Server listening on port ${process.env.PORT || 3000}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}
