import { useCallback, useEffect, useState } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { DEFAULT_STORE_IDENTITY, StoreIdentityContext } from "./storeIdentity";

export function StoreIdentityProvider({ children }) {
  const [identity, setIdentity] = useState(DEFAULT_STORE_IDENTITY);

  const loadIdentity = useCallback(async () => {
    const response = await fetchDataFromApi("/api/settings");
    if (response?.error || !response?.settings?.storeIdentity) {
      console.error(
        "Impossible de charger l'identité de la boutique :",
        response?.message || "Paramètres indisponibles",
      );
      return;
    }

    const storeIdentity = response.settings.storeIdentity;
    setIdentity((current) => ({
      ...current,
      ...storeIdentity,
      socialLinks: {
        ...current.socialLinks,
        ...storeIdentity.socialLinks,
      },
    }));
  }, []);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        Promise.resolve().then(loadIdentity);
      }
    };

    Promise.resolve().then(loadIdentity);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () =>
      document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [loadIdentity]);

  return (
    <StoreIdentityContext.Provider value={{ identity, setIdentity }}>
      {children}
    </StoreIdentityContext.Provider>
  );
}
