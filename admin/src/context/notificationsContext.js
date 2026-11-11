import { createContext } from "react";

export const AdminNotificationsContext = createContext({
  orders: 0,
  contactMessages: 0,
  supportMessages: 0,
});
