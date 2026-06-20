import Schedule from "../models/Schedule.js";
import { createSchedule } from "../services/scheduleService.js";
import { maybeAutoSyncSchedule } from "../services/googleCalendarService.js";

export const addSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const schedule = await createSchedule(req.body, userId);

    res.status(201).json({ message: "Schedule created", data: schedule });
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.user._id })
      .populate("medicineId", "name form");
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id })
      .populate({
        path: "medicineId",
        model: "Medicine",
        select: "name dosage form"
      });

    if (!schedule) return res.status(404).json({ error: "Not Found" });

    res.json(schedule);
  } catch (err) {
    console.error("Failed to fetch schedule:", err);
    res.status(500).json({ message: "Failed to fetch schedule" });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    maybeAutoSyncSchedule(req.user._id, schedule._id, "sync").catch((err) =>
      console.error("Calendar auto-sync failed on update:", err.message)
    );

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findOne({ _id: id, userId: req.user._id });

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    await maybeAutoSyncSchedule(req.user._id, schedule._id, "delete");

    await schedule.deleteOne();

    res.status(200).json({ success: true, message: "Schedule and related doses/notifications deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error while deleting schedule" });
  }
};
