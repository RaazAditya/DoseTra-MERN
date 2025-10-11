import mongoose from "mongoose";
import Schedule from "./Schedule.js";

const medicineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    }, // e.g., "500mg"
    form: {
      type: String,
      enum: ["tablet", "capsule", "syrup", "injection"], //tablet and capsule is considered as similar
      default: "tablet",
    },
    frequency: {
      type: String,
      required: true
    },
    instructions: {
      type: String,
    }, // e.g., "After meals"
  },
  { timestamps: true }
);


// Cascade delete schedules when a medicine is deleted
medicineSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const medicineId = this._id;
    const schedules = await Schedule.find({ medicineId });
    for (const sched of schedules) {
      await sched.deleteOne(); // triggers Schedule pre-hook to delete doses
    }
    next();
  } catch (err) {
    next(err);
  }
});



export default mongoose.model("Medicine", medicineSchema);
