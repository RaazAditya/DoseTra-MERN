import { Schema, model } from "mongoose";

const doseLogSchema = new Schema({
  schedule: { type: Schema.Types.ObjectId, ref: "Schedule", required: true },
  time: { type: Date, required: true },
  status: {
    type: String,
    enum: ["taken", "missed", "rescheduled"],
    required: true,
  },
}, { timestamps: true });

export default model("DoseLog", doseLogSchema);
