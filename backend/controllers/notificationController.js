import cron from "node-cron";
import nodemailer from "nodemailer";
import webpush from "web-push";
import Dose from "../models/Dose.js";
import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";
import dotenv from "dotenv";
dotenv.config();



//  Email Setup (Nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


//  Web Push Setup

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC,
  privateKey: process.env.VAPID_PRIVATE,
};

console.log("Loaded VAPID keys:", vapidKeys); 

webpush.setVapidDetails(
  "mailto:yourgmail@gmail.com", // your contact email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);


// Subscribe to Browser Notifications

export const subscribeNotification = async (req, res) => {
  try {
    const userId = req.user._id; // requires auth middleware
    const subscription = req.body;

    const existing = await Subscription.findOne({ endpoint: subscription.endpoint });
    if (existing) return res.json({ message: "Already subscribed" });

    await Subscription.create({ userId, ...subscription });
    res.json({ message: "Subscribed for browser notifications" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//  Send Test Notification

export const sendTestNotification = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user?._id;

    // Email Test
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email || process.env.EMAIL_USER,
      subject: "Dosetra Test Notification",
      text: "This is a test notification from Dosetra.",
    });

    // Browser Test
    const subs = await Subscription.find({ userId });
    for (const sub of subs) {
      await webpush.sendNotification(
        sub,
        JSON.stringify({
          title: "Dosetra",
          body: "This is a test browser notification!",
        })
      );
      await Notification.create({
        userId,
        type: "browser",
        title: "Dosetra",
        message: "This is a test browser notification!",
      });
    }

    res.json({ message: "Test notification sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Cron Job - Reminders

cron.schedule("* * * * *", async () => {
  console.log("Running cron job for medicine reminders...");

  const now = new Date();
  const doses = await Dose.find({
    status: "pending",
    scheduledAt: { $lte: new Date(now.getTime() + 60000) },
  }).populate("userId");

  for (const dose of doses) {
    const user = dose.userId;
    if (!user) continue;

    const message = `Hi ${user.name}, it's time to take your medicine (${dose.medicineName}).`;

    // Email Notification
    if (["email", "both"].includes(user.settings.notificationPreference)) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Medicine Reminder - Dosetra",
          text: message,
        });
        await Notification.create({
          userId: user._id,
          type: "email",
          title: "Medicine Reminder",
          message,
        });
      } catch (err) {
        await Notification.create({
          userId: user._id,
          type: "email",
          title: "Medicine Reminder",
          message,
          status: "failed",
        });
      }
    }

    // Browser Notification 
    if (["browser", "both"].includes(user.settings.notificationPreference)) {
      const subs = await Subscription.find({ userId: user._id });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            sub,
            JSON.stringify({
              title: "Medicine Reminder",
              body: message,
            })
          );
          await Notification.create({
            userId: user._id,
            type: "browser",
            title: "Medicine Reminder",
            message,
          });
        } catch (err) {
          console.error(" Push send failed:", err.message);
        }
      }
    }
  }
});
