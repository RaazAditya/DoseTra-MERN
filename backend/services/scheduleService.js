import Schedule from "../models/Schedule.js";
import { createDosesForSchedule } from "./doseService.js";
import { createNotificationsForDoses } from "./notificationService.js";
import { maybeAutoSyncSchedule } from "./googleCalendarService.js";

export const createSchedule = async (data, userId) => {
  const schedule = new Schedule({
    ...data,
    userId: userId
  });
  await schedule.save();

  const doses = await createDosesForSchedule(schedule, userId);
  await createNotificationsForDoses(doses, userId);

  maybeAutoSyncSchedule(userId, schedule._id, "sync").catch((err) =>
    console.error("Calendar auto-sync failed on create:", err.message)
  );

  return schedule;
};
