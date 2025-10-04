import Schedule from "../models/Schedule.js";

// Create Schedule
export const createSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.create(req.body);
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Schedules
export const getSchedules = async (req, res) => {
  const schedules = await Schedule.find();
  res.json(schedules);
};

// Get One Schedule
export const getSchedule = async (req, res) => {
  const schedule = await Schedule.findOne({ scheduleId: req.params.id });
  if (!schedule) return res.status(404).json({ error: "Not Found" });
  res.json(schedule);
};

// Update Schedule
export const updateSchedule = async (req, res) => {
  const schedule = await Schedule.findOneAndUpdate(
    { scheduleId: req.params.id },
    req.body,
    { new: true }
  );
  res.json(schedule);
};

// Delete/Deactivate Schedule
export const deleteSchedule = async (req, res) => {
  await Schedule.findOneAndUpdate(
    { scheduleId: req.params.id },
    { active: false }
  );
  res.json({ message: "Schedule deactivated" });
};
