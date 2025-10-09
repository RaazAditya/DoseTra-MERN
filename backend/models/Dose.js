import mongoose from "mongoose";

const DoseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.String, ref: "User" },
  scheduleId: { type: mongoose.Schema.Types.String, ref: "Schedule" },
  scheduledAt: Date,
  status: { type: String, enum: ["pending", "taken", "missed"], default: "pending" },
  reminderSentAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Dose", DoseSchema);
