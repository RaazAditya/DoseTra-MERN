import mongoose from "mongoose";

const DoseLogSchema = new mongoose.Schema({
  logId: { type: String, unique: true },
  userId: String,
  doseId: { type: mongoose.Schema.Types.String, ref: "Dose" },
  action: { type: String, enum: ["taken", "missed", "rescheduled"] },
  recordedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("DoseLog", DoseLogSchema);

