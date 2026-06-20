import Notification from "../models/Notification.js";
import { getIO, getConnectedUsers } from "../sockets/socket.js";
import cron from "node-cron";
import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";
import webpush from "web-push";
import { sendPushNotification } from "../utils/webPush.js";
/**
 * Create notifications for a list of doses
 * @param {Array} doses - Array of dose objects
 * @param {String} userId - User ID
 * @returns {Array} Created notifications
 */
export const createNotificationsForDoses = async (doses, userId) => {
  if (!doses || doses.length === 0) return [];
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
    scheduledAt: dose.scheduledAt,
  }));
  

  return await Notification.insertMany(notifications);
};

/**
 * Cron job: send pending notifications via browser + email
 */
export const startNotificationJob = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const io = getIO();
    const connectedUsers = getConnectedUsers();

    try {
      // Iterate over connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        // Fetch pending notifications
        const notifications = await Notification.find({
          userId,
          status: "pending",
          scheduledAt: { $lte: now },
        }).populate({
          path: "doseId",
          populate: {
            path: "scheduleId",
            populate: { path: "medicineId", select: "name dosage form" },
          },
        });

        if (!notifications.length) continue;

        // Fetch user email
        const user = await User.findById(userId);
        const email = user?.email;

        for (const notif of notifications) {
          const dose = notif.doseId;
          const schedule = dose?.scheduleId;
          const medicine = schedule?.medicineId;

          // 1️⃣ Browser notification
          io.to(socketId).emit("notification", {
            _id: notif._id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            createdAt: notif.createdAt,
            doseInfo: dose
              ? {
                  scheduledAt: dose.scheduledAt,
                  status: dose.status,
                  medicineName: medicine?.name,
                  medicineDosage: medicine?.dosage,
                  form: medicine?.form,
                }
              : null,
          });

          // 2️⃣ Browser push notification (real push)
          if (user?.pushSubscription) {
            // Construct payload same as email content (simpler, push notifications should be concise)
            const payload = {
              title: "DoseTra Reminder 💊",
              body: `
Hello ${user.name || "User"},
Time to take your medicine:
• Medicine: ${medicine?.name || "-"}
• Dosage: ${dose?.scheduleId?.dosage || "-"}
• Form: ${medicine?.form || "-"}
• Scheduled At: ${dose?.scheduledAt.toLocaleString()}
    `.trim(),
            };

            console.log("Sending push:", payload);

            await webpush.sendNotification(
              user.pushSubscription,
              JSON.stringify(payload)
            );
          }
          // 2️⃣ Email notification
          if (email) {
            const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#333;">
      <h2 style="color:#4F46E5;">DoseTra Reminder</h2>
      <p>Hello ${user.name || "User"},</p>
      <p>It's time to take your medicine:</p>
      <ul>
        <li><strong>Medicine:</strong> ${medicine?.name || "Medicine"}</li>
        <li><strong>Dosage:</strong> ${dose?.scheduleId?.dosage || "-"}</li>
        <li><strong>Form:</strong> ${medicine?.form || "-"}</li>
        <li><strong>Scheduled At:</strong> ${dose?.scheduledAt.toLocaleString()}</li>
      </ul>
      <p style="color:#4F46E5;">Stay healthy! 💊</p>
      <hr />
      <p style="font-size:0.85rem; color:#888;">This is an automated reminder from DoseTra.</p>
    </div>
  `;
            await sendEmail(email, "Dose Reminder from DoseTra", htmlContent);
          }

          // 3️⃣ Update status to sent
          notif.status = "sent";
          notif.sentAt = new Date();
          await notif.save();
        }
      }
    } catch (err) {
      console.error("❌ Error sending notifications:", err);
    }
  });

  console.log("⏰ Notification cron job with email started");
};
