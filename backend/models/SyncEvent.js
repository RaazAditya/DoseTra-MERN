import mongoose from "mongoose";

const syncEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    externalEventId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "synced", "deleted"],
      default: "synced",
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

syncEventSchema.index({ userId: 1, scheduleId: 1, timeSlot: 1 }, { unique: true });

export default mongoose.model("SyncEvent", syncEventSchema);
