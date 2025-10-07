import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema({
  scheduleId: { type: String, unique: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" }, // link to medicine
  dosage: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  times: [String],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Schedule", ScheduleSchema);


