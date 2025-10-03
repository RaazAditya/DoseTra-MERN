import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { 
        type: String, 
        required: true 
    },
    brand: {
        type: String,
        required: true
    },
    dosage: {
         type: String, 
         required: true }, // e.g., "500mg"
    form: {
      type: String,
      enum: ["tablet", "syrup", "injection"],  //tablet and capsule is considered as similar
      default: "tablet",
    },
    instructions: { 
        type: String
     }, // e.g., "After meals"
  },
  { timestamps: true }
);

export default mongoose.model("Medicine", medicineSchema);
