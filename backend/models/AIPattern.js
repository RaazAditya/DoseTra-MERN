import mongoose from "mongoose";

const aiPatternSchema = new mongoose.Schema(
  {
    patternId: { 
        type: String, 
        required: true, 
        unique: true }, 
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patternType: {
      type: String,
      enum: ["missedDose", "lateDose", "interaction", "other"],
      required: true,
    },
    probability: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 1 }, 
    features: { type: Object }, // JSON object storing AI features used for prediction
    start: { 
        type: Date, 
        required: true }, // Start of predicted risk window
    end: { 
        type: Date,
        required: true }, // End of predicted risk window
  },
  { timestamps: true }
);

export default mongoose.model("AiPattern", aiPatternSchema);
