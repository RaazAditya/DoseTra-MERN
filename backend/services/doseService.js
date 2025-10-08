import Dose from "../models/Dose.js";

export const createDosesForSchedule = async (schedule, userId) => {
  const doses = [];

  schedule.times.forEach(time => {
    let currentDate = new Date(schedule.startDate);
    while (currentDate <= schedule.endDate) {
      const scheduledAt = new Date(
        `${currentDate.toISOString().split("T")[0]}T${time}:00.000Z`
      );

      doses.push({
        doseId: `${schedule.scheduleId}-${scheduledAt.getTime()}`,
        userId,
        scheduleId: schedule.scheduleId,
        scheduledAt,
      });

      currentDate.setDate(currentDate.getDate() + 1); // increment 1 day
    }
  });

  return await Dose.insertMany(doses);
};
