import Dose from "../models/Dose.js";

export const createDosesForSchedule = async (schedule, userId) => {
  const doses = [];

  schedule.times.forEach((time) => {
    let currentDate = new Date(schedule.startDate);

    while (currentDate <= schedule.endDate) {
      const [hours, minutes] = time.split(":").map(Number);

      const scheduledAt = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        hours,
        minutes,
        0,
        0
      ); // local time

      doses.push({
        userId,
        scheduleId: schedule._id,
        scheduledAt,
      });

      currentDate.setDate(currentDate.getDate() + 1); // increment 1 day
    }
  });

  return await Dose.insertMany(doses);
};

export const getAllDoses = async (req, res) => {
  try {
    const userId = req.user._id; // or however you're storing it (JWT, session, etc.)

    const doses = await Dose.find({ userId })
      .populate({
        path: "scheduleId",
        populate: {
          path: "medicineId",
          select: "name form dosage", // only fetch needed fields
        },
      })
      .sort({ scheduledAt: -1 });

    res.status(200).json({
      success: true,
      doses,
    });
  } catch (error) {
    console.error("Error fetching doses:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
