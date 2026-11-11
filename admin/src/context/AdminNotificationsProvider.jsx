import React, { useCallback, useEffect, useState } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { AdminNotificationsContext } from "./notificationsContext";

const EMPTY_NOTIFICATIONS = {
  orders: 0,
  contactMessages: 0,
  supportMessages: 0,
};

export function AdminNotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(EMPTY_NOTIFICATIONS);

  const refreshNotifications = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const response = await fetchDataFromApi("/api/notifications/admin");
    if (response?.success && response.data) {
      setNotifications(response.data);
    } else if (response?.error) {
      console.error(
        "Impossible de charger les notifications admin:",
        response.message || "Erreur serveur",
      );
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(refreshNotifications);
    const intervalId = window.setInterval(refreshNotifications, 10000);
    document.addEventListener("visibilitychange", refreshNotifications);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshNotifications);
    };
  }, [refreshNotifications]);

  return (
    <AdminNotificationsContext.Provider value={notifications}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}
