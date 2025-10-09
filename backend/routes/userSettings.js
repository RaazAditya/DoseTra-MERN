import express from "express";
import User from "../models/User.js";

const router = express.Router();

// toggle smart reminders
router.post("/:userId/smart-reminder", async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { smartReminders: enabled },
      { new: true }
    );

    res.json({ success: true, smartReminders: user.smartReminders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
// Export the router