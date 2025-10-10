import mongoose from "mongoose";
import Notification from "./Notification.js";

const DoseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  scheduledAt: Date,
  status: { type: String, enum: ["pending", "taken", "missed"], default: "pending" },
  reminderSentAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Cascade delete notifications when a dose is deleted
DoseSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const doseId = this._id;
    await Notification.deleteMany({ doseId });
    next();
  } catch (err) {
    next(err);
  }
});


export default mongoose.model("Dose", DoseSchema);
