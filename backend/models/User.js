// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: function () {
      return this.provider === "local";
    },
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  picture: {
    type: String,
    default: "",
  },
  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  isVerified: {
    type: Boolean,
    default: function () {
      return this.provider === "google";
    },
  },
  otp: {
    type: String,
    select: false,
  },
  otpExpiry: {
    type: Date,
    select: false,
  },
  timezone: {
    type: String,
    default: "UTC",
  },
  settings: {
    notificationPreference: { 
         type: String,
         enum: ["browser", "email", "both"], 
         default: "both" 
        },
    language: { 
        type: String, 
        default: "en" 
    }
  },
  pushSubscription: {
    endpoint: { type: String },
    keys: {
      p256dh: { type: String },
      auth: { type: String }
    },
    type: { type: String, default: "webpush" }
  },
  smartReminders: {
    type: Boolean,
    default: false
  },
  googleCalendar: {
    connected: { type: Boolean, default: false },
    autoSync: { type: Boolean, default: true },
    calendarId: { type: String, default: "primary" },
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiry: { type: Date, select: false },
    lastSyncedAt: { type: Date, default: null },
  },
  latestAiReminderNote: {
  type: String,
  default: "",
},
}, { timestamps: true });

export default mongoose.model("User", userSchema);
