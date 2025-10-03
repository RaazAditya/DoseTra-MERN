import { Schema, model } from "mongoose";

const scheduleSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  times: [String],          
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default model("Schedule", scheduleSchema);
