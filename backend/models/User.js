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
    required: true
  },
  timezone: {
    type: String,
    default: "Asia/Mumbai"
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
  smartReminders: {
  type: Boolean,
  default: false
}

}, { timestamps: true });

export default mongoose.model("User", userSchema);
