import axios from "axios";

export const registerPush = async (vapidPublicKey) => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  // 1️⃣ Ask user for notification permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("🚫 Push notifications permission denied");
    return;
  }

  // 2️⃣ Register service worker
  const sw = await navigator.serviceWorker.register("/sw.js");
  console.log("✅ Service Worker registered:", sw);

  // 3️⃣ Subscribe to push manager
  const subscription = await sw.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  // 4️⃣ Send subscription to backend with Axios & JWT
  try {
    const token = localStorage.getItem("token"); // your auth token

    const res = await axios.post(
      "http://localhost:7000/api/push/subscribe",
      { subscription },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Browser push subscription sent to server:", res.data);
  } catch (err) {
    console.error("❌ Error sending push subscription:", err);
  }
};

// Helper: convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
