import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:info@dosetra.com",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

export const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log("📨 Push notification sent!");
  } catch (err) {
    console.error("❌ Push notification error:", err);
  }
};
