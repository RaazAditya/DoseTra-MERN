import Schedule, { find, findOne, findOneAndUpdate } from "../models/Schedule";

export async function createSchedule(req, res) {
  try {
    const sched = new Schedule({ ...req.body, user: req.user._id });
    await sched.save();
    return res.status(201).json(sched);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create schedule" });
  }
}

export async function getSchedules(req, res) {
  try {
    const schedules = await find({ user: req.user._id, active: true });
    return res.json(schedules);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch schedules" });
  }
}

export async function getScheduleById(req, res) {
  try {
    const sched = await findOne({ _id: req.params.id, user: req.user._id });
    if (!sched) return res.status(404).json({ error: "Not found" });
    return res.json(sched);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
}

export async function updateSchedule(req, res) {
  try {
    const updated = await findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update" });
  }
}

export async function deleteSchedule(req, res) {
  try {
    const deactivated = await findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { active: false },
      { new: true }
    );
    if (!deactivated) return res.status(404).json({ error: "Not found" });
    return res.json(deactivated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to deactivate" });
  }
}
