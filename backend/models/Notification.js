import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    doseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule", // link to dose/schedule
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // helps query all user notifications
    },
    type: {
      type: String,
      enum: ["email", "browser"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    subscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String,
      },
    },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
