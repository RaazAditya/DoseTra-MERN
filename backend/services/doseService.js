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
