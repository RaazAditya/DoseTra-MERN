import Notification from "../models/Notification.js";

export const createNotificationsForDoses = async (doses, userId) => {
  const notifications = doses.map(dose => ({
    userId,
    type: "browser", // or email, configurable later
    title: "Medication Reminder",
    message: `Take your medicine at ${dose.scheduledAt.toLocaleString()}`,
    status: "sent"
  }));

  return await Notification.insertMany(notifications);
};
