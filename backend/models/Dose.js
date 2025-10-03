import mongoose from "mongoose";

const DoseSchema = new mongoose.Schema({
  doseId: { type: String, unique: true },
  userId: String,
  scheduleId: { type: mongoose.Schema.Types.String, ref: "Schedule" },
  scheduledAt: Date,
  status: { type: String, enum: ["pending", "taken", "missed"], default: "pending" },
  reminderSentAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Dose", DoseSchema);
