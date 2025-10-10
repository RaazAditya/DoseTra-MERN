
import Notification from "../models/Notification.js";
import dotenv from "dotenv";
import { getIO, getConnectedUsers } from "../sockets/socket.js";
dotenv.config();




//  GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    // 1️ Find only "sent" notifications for this user
    const notifications = await Notification.find({
      userId: req.user._id,
      status: "sent", // only sent ones
    })
      .sort({ createdAt: -1 })
      .populate({
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
      })
      .select("type title message seen sentAt createdAt updatedAt status doseId"); //  ensure createdAt is included

    // Transform for frontend with enhanced info
    const notificationsWithDoseInfo = notifications.map((notif) => {
      const dose = notif.doseId;
      const schedule = dose?.scheduleId;
      const medicine = schedule?.medicineId;

      return {
        _id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        seen: notif.seen,
        sentAt: notif.sentAt,
        createdAt: notif.createdAt, //  explicit inclusion
        updatedAt: notif.updatedAt,
        status: notif.status || "sent", //  attach status explicitly

        doseInfo: dose
          ? {
              scheduledAt: dose.scheduledAt,
              status: dose.status,
              // Schedule info
              scheduleDosage: schedule?.dosage,
              scheduleFrequency: schedule?.frequency,
              // Medicine info
              medicineName: medicine?.name,
              medicineDosage: medicine?.dosage,
              form: medicine?.form,
              instructions: medicine?.instructions,
            }
          : null,
      };
    });

    res.json(notificationsWithDoseInfo);
  } catch (err) {
    console.error(" Failed to fetch notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};



// PATCH /api/notifications/mark-seen
export const markNotificationsSeen = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, seen: false },
      { $set: { seen: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notifications seen" });
  }
};

// POST /api/notifications
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, subscription } = req.body;

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      subscription: subscription || null,
      status: "sent",
    });

    // Emit notification via socket if user is online
    const connectedUsers = getConnectedUsers();
    const io = getIO();
    const socketId = connectedUsers.get(userId.toString());
    if (socketId && io) {
      io.to(socketId).emit("notification", notification);
    }

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: "Failed to create notification", error: err.message });
  }
};

