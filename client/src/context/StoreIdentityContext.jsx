import { useEffect, useState } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { DEFAULT_STORE_IDENTITY, StoreIdentityContext } from "./storeIdentity";

export function StoreIdentityProvider({ children }) {
  const [identity, setIdentity] = useState(DEFAULT_STORE_IDENTITY);

  useEffect(() => {
    let cancelled = false;
    fetchDataFromApi("/api/settings").then((response) => {
      if (cancelled) return;
      if (response?.error || !response?.settings?.storeIdentity) {
        console.error(
          "Impossible de charger l'identité de la boutique:",
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
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StoreIdentityContext.Provider value={identity}>
      {children}
    </StoreIdentityContext.Provider>
  );
}
