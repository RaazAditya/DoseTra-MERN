import DoseLog, { find } from "../models/DoseLog";


export async function takeDose(req, res) {
  try {
    const scheduleId = req.params.id;
    const log = new DoseLog({ schedule: scheduleId, time: new Date(), status: "taken" });
    await log.save();
    return res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark taken" });
  }
}

export async function missDose(req, res) {
  try {
    const scheduleId = req.params.id;
    const log = new DoseLog({ schedule: scheduleId, time: new Date(), status: "missed" });
    await log.save();
    return res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark missed" });
  }
}

export async function rescheduleDose(req, res) {
  try {
    const scheduleId = req.params.id;
    // Optionally, read a new time from body
    const { newTime } = req.body;
    const log = new DoseLog({
      schedule: scheduleId,
      time: newTime ? new Date(newTime) : new Date(),
      status: "rescheduled",
    });
    await log.save();
    return res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reschedule" });
  }
}

export async function getLogs(req, res) {
  try {
    const logs = await find({}).populate("schedule");
    return res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
}
