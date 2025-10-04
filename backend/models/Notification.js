import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["email", "browser"],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["sent", "failed"], 
    default: "sent" 
  },
  subscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
