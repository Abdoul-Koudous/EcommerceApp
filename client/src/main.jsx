import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { UserProvider } from "./UserContext/UserContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
