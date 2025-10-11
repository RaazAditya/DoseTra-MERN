import mongoose from "mongoose";
import Dose from "./Dose.js";

const ScheduleSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" }, // link to medicine
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // link to user
  dosage: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  times: [String],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Cascade delete doses when a schedule is deleted
ScheduleSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const scheduleId = this._id;
    const doses = await Dose.find({ scheduleId });
    for (const dose of doses) {
      await dose.deleteOne(); // triggers Dose pre-hook to delete notifications
    }
    next();
  } catch (err) {
    next(err);
  }
});



export default mongoose.model("Schedule", ScheduleSchema);


