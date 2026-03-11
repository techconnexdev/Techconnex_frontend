/* TechConnex Push Notification Service Worker */
self.addEventListener("push", function (event) {
  let data = { title: "TechConnex", body: "", url: "/" };
  try {
    if (event.data) data = { ...data, ...JSON.parse(event.data.text()) };
  } catch (_) {}
  const options = {
    body: data.body,
    icon: "/logo.png",
    badge: "/logo.png",
    data: { url: data.url || "/" },
    actions: [{ action: "open", title: "Open" }],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
