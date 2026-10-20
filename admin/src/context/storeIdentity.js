import { createContext } from "react";

export const DEFAULT_STORE_IDENTITY = {
  name: "YebouShop",
  logoLight: "",
  logoDark: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  promoBanner: "",
  socialLinks: {
    facebook: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
  },
};

export const StoreIdentityContext = createContext({
  identity: DEFAULT_STORE_IDENTITY,
  setIdentity: () => {},
});
