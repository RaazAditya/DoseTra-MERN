import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema({
  scheduleId: { type: String, unique: true },
  medicaineId: { type: String },
  dosage: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  times: [String], // JSON array of times
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Schedule", ScheduleSchema);

