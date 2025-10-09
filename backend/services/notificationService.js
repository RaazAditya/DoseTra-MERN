import Notification from "../models/Notification.js";
import { getIO, getConnectedUsers } from "../sockets/socket.js";
import cron from "node-cron";

/**
 * Create notifications for a list of doses
 * @param {Array} doses - Array of dose objects
 * @param {String} userId - User ID
 * @returns {Array} Created notifications
 */
export const createNotificationsForDoses = async (doses, userId) => {
  if (!doses || doses.length === 0) return [];
  console.log("doses")
  console.log(doses)
  const notifications = doses.map((dose) => ({
    userId,
    doseId: dose._id, // ✅ reference the correct dose
    type: "browser",
    title: "Medication Reminder!!!",
    message: `Time to take ${dose.dosage || ""} of ${
      dose.medicineName || "your medicine"
    } at ${dose.scheduledAt.toLocaleTimeString()}`,
    status: "pending",
    seen: false,
    sentAt: null,
    scheduledAt: dose.scheduledAt
  }));
  console.log("notifications")
  console.log(notifications)

  return await Notification.insertMany(notifications);
};

// Cron job to push pending notifications
export const startNotificationJob = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const io = getIO();
    const connectedUsers = getConnectedUsers();

    try {
      console.log("Connected users:", connectedUsers);

      for (const [userId, socketId] of connectedUsers.entries()) {
        // Fetch pending notifications and populate Dose → Schedule → Medicine
        const notifications = await Notification.find({
          userId,
          status: "pending",
          scheduledAt: { $lte: now },
        }).populate({
          path: "doseId",
          model: "Dose",
          populate: {
            path: "scheduleId",
            model: "Schedule",
            populate: {
              path: "medicineId",
              model: "Medicine",
              select: "name dosage form frequency instructions",
            },
          },
        });
        if (!notifications.length) continue;

        for (const notif of notifications) {
          const dose = notif.doseId;
          const schedule = dose?.scheduleId;
          const medicine = schedule?.medicineId;

          io.to(socketId).emit("notification", {
            _id: notif._id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            createdAt: notif.createdAt,  // ✅ include original creation time
            doseInfo: dose
              ? {
                  scheduledAt: dose.scheduledAt,
                  status: dose.status,
                  // Schedule info
                  scheduleFrequency: schedule?.frequency,
                  scheduleDosage: schedule?.dosage,
                  // Medicine info
                  medicineName: medicine?.name || "Medicine",
                  medicineDosage: medicine?.dosage,
                  form: medicine?.form,
                  instructions: medicine?.instructions,
                }
              : null,
          });
          // Update status to "sent"
          notif.status = "sent";
          notif.sentAt = new Date();
          await notif.save();
        }
      }
    } catch (err) {
      console.error("❌ Error sending notifications:", err);
    }
  });

  console.log("⏰ Notification cron job started");
};
