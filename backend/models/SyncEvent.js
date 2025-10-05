import mongoose from "mongoose";

const syncEventSchema = new mongoose.Schema(
  {
    syncEventId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoseSchedule",
      required: true,
    }, // links to specific dose
    externalEventId: { 
        type: String 
    }, // Google Calendar event ID or other external calendar system
    status: {
      type: String,
      enum: ["pending", "synced", "deleted"],
      default: "pending",
    }, // tracks current state
    lastSyncedAt: { 
        type: Date, 
        default: null
    }, // timestamp of last successful sync
    notes: { type: String }, 
  },
  { timestamps: true }
);

export default mongoose.model("SyncEvent", syncEventSchema);
