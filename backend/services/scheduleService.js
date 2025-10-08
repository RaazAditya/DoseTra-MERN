import Schedule from "../models/Schedule.js";
import { createDosesForSchedule } from "./doseService.js";
import { createNotificationsForDoses } from "./notificationService.js";

export const createSchedule = async (data, userId) => {
  // 1. Save schedule
  const schedule = new Schedule({
    ...data,
    userId: userId
  });
  await schedule.save();

  // 2. Generate doses
  const doses = await createDosesForSchedule(schedule, userId);

  // 3. Generate notifications
  await createNotificationsForDoses(doses, userId);

  return schedule;
};
