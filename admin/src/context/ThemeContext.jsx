import React, { useCallback, useState, useEffect } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { ThemeContext } from "./themeContext";
import { DEFAULT_THEME_COLORS } from "./themeColors";

function applyPrimaryColor(color, theme) {
  const root = document.documentElement;
  const channels = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!channels) return;

  const rgb = channels.slice(1).map((channel) => parseInt(channel, 16));
  const adjusted = rgb.map((value) =>
    Math.round(
      theme === "dark" ? value + (255 - value) * 0.18 : value * 0.82,
    ),
  );
  const toHex = (value) => value.toString(16).padStart(2, "0");
  const luminance =
    rgb.reduce((sum, value, index) => {
      const channel = value / 255;
      const linear =
        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);

  root.style.setProperty("--color-primary", color);
  root.style.setProperty(
    "--color-primary-hover",
    `#${adjusted.map(toHex).join("")}`,
  );
  root.style.setProperty(
    "--color-primary-soft",
    `rgba(${rgb.join(", ")}, ${theme === "dark" ? 0.15 : 0.08})`,
  );
  root.style.setProperty(
    "--color-primary-soft-strong",
    `rgba(${rgb.join(", ")}, ${theme === "dark" ? 0.22 : 0.1})`,
  );
  root.style.setProperty(
    "--color-primary-soft-bg",
    `rgba(${rgb.join(", ")}, ${theme === "dark" ? 0.16 : 0.06})`,
  );
  root.style.setProperty("--color-accent", color);
  root.style.setProperty(
    "--color-text-on-primary",
    luminance > 0.45 ? "#171717" : "#ffffff",
  );
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const [themeColors, setThemeColors] = useState(DEFAULT_THEME_COLORS);

  const loadThemeColors = useCallback(async () => {
    const response = await fetchDataFromApi("/api/settings");
    if (response?.error) {
      console.error(
        "Impossible de charger les couleurs du thème :",
        response.message || "Paramètres indisponibles",
      );
      return;
    }

    if (response?.settings?.themeColors) {
      setThemeColors((current) => ({
        ...current,
        ...response.settings.themeColors,
      }));
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    applyPrimaryColor(themeColors.adminPrimary, theme);
  }, [theme, themeColors.adminPrimary]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        Promise.resolve().then(loadThemeColors);
      }
    };

    Promise.resolve().then(loadThemeColors);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () =>
      document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [loadThemeColors]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, themeColors, setThemeColors }}
    >
      {children}
    </ThemeContext.Provider>
  );
};