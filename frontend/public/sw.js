// public/sw.js
self.addEventListener("install", (e) => {
  console.log("SW installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("SW activated.");
});

self.addEventListener("push", (event) => {
  console.log("📬 Push received:", event);

  let data = { title: "Test Notification", body: "No payload received." };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    requireInteraction: true, // ensures the notification stays until user interacts
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) clientList[0].focus();
      else clients.openWindow("/");
    })
  );
});
