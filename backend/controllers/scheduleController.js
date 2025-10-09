import Schedule from "../models/Schedule.js";
import { createSchedule } from "../services/scheduleService.js";

//add schedule
export const addSchedule = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const schedule = await createSchedule(req.body, userId);

    res.status(201).json({ message: "Schedule created", data: schedule });
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get All Schedules
export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.user._id })
      .populate("medicineId", "name form");
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get One Schedule with populated medicine info
export const getSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id })
      .populate({
        path: "medicineId",           // populate the medicineId
        model: "Medicine",            // specify the model
        select: "name dosage form"    // select the fields you need
      });

    if (!schedule) return res.status(404).json({ error: "Not Found" });

    res.json(schedule);
  } catch (err) {
    console.error("❌ Failed to fetch schedule:", err);
    res.status(500).json({ message: "Failed to fetch schedule" });
  }
};


// Update Schedule
export const updateSchedule = async (req, res) => {
  const schedule = await Schedule.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true }
  );
  res.json(schedule);
};

// Delete/Deactivate Schedule
export const deleteSchedule = async (req, res) => {
  console.log("i am in deleteSchedule")
  console.log("trhis ",req.params.id)
  await Schedule.findOneAndUpdate(
    { _id: req.params.id },
    { active: false }
  );
  res.json({ message: "Schedule deactivated" });
};
