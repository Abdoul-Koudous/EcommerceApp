import SettingsModel from "../models/settings.model.js";

export const PAYMENT_METHODS = {
  FEDAPAY: "fedapay",
  KKIAPAY: "kkiapay",
  CASH_ON_DELIVERY: "cashOnDelivery",
};

const ALLOWED_PAYMENT_KEYS = Object.values(PAYMENT_METHODS);

const ALLOWED_SOCIAL_LINKS = ["facebook", "instagram", "tiktok", "linkedin"];

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

// Comportement actuel du checkout : les 3 moyens sont proposés.
// Un document Settings déjà en base sans ce champ reste donc inchangé
// visuellement jusqu'à ce que l'admin enregistre un choix.
export const DEFAULT_PAYMENT_METHODS = {
  fedapay: true,
  kkiapay: true,
  cashOnDelivery: true,
};

export async function getOrCreateSettings() {
  return SettingsModel.findOneAndUpdate(
    { key: "singleton" },
    { $setOnInsert: { key: "singleton" } },
    { new: true, upsert: true },
  );
}

export function normalizePaymentMethods(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    fedapay: src.fedapay !== false,
    kkiapay: src.kkiapay !== false,
    cashOnDelivery: src.cashOnDelivery !== false,
  };
}

export function normalizeStoreIdentity(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const socialLinks =
    source.socialLinks && typeof source.socialLinks === "object"
      ? source.socialLinks
      : {};

  return {
    ...DEFAULT_STORE_IDENTITY,
    ...source,
    socialLinks: {
      ...DEFAULT_STORE_IDENTITY.socialLinks,
      ...socialLinks,
    },
  };
}

export function parseStoreIdentityPayload(body) {
  if (body === undefined) {
    return undefined;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const err = new Error("storeIdentity doit être un objet");
    err.status = 400;
    throw err;
  }

  const allowedFields = [
    "name",
    "logoLight",
    "logoDark",
    "email",
    "phone",
    "whatsapp",
    "address",
    "promoBanner",
    "socialLinks",
  ];
  const unknownFields = Object.keys(body).filter(
    (key) => !allowedFields.includes(key),
  );

  if (unknownFields.length > 0) {
    const err = new Error(
      `Champs d'identité inconnus : ${unknownFields.join(", ")}`,
    );
    err.status = 400;
    throw err;
  }

  const parsed = {};
  const maxLengths = {
    name: 100,
    logoLight: 2048,
    logoDark: 2048,
    email: 254,
    phone: 40,
    whatsapp: 40,
    address: 300,
    promoBanner: 180,
  };

  for (const [field, maxLength] of Object.entries(maxLengths)) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string") {
      const err = new Error(`${field} doit être du texte`);
      err.status = 400;
      throw err;
    }

    const value = body[field].trim();
    if (
      value.length > maxLength ||
      (field === "name" && !value) ||
      (field === "name" && /[\r\n]/.test(value))
    ) {
      const err = new Error(
        field === "name"
          ? "Le nom de la boutique est obligatoire"
          : `${field} dépasse la longueur autorisée`,
      );
      err.status = 400;
      throw err;
    }

    if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      const err = new Error("L'adresse e-mail de la boutique est invalide");
      err.status = 400;
      throw err;
    }

    if (["logoLight", "logoDark"].includes(field) && value) {
      let logoUrl;
      try {
        logoUrl = new URL(value);
      } catch {
        const err = new Error("L'URL du logo est invalide");
        err.status = 400;
        throw err;
      }
      if (logoUrl.protocol !== "https:") {
        const err = new Error("L'URL du logo doit utiliser HTTPS");
        err.status = 400;
        throw err;
      }
    }

    parsed[field] = value;
  }

  if (body.socialLinks !== undefined) {
    if (
      !body.socialLinks ||
      typeof body.socialLinks !== "object" ||
      Array.isArray(body.socialLinks)
    ) {
      const err = new Error("socialLinks doit être un objet");
      err.status = 400;
      throw err;
    }

    const unknownLinks = Object.keys(body.socialLinks).filter(
      (key) => !ALLOWED_SOCIAL_LINKS.includes(key),
    );
    if (unknownLinks.length > 0) {
      const err = new Error(
        `Réseaux sociaux inconnus : ${unknownLinks.join(", ")}`,
      );
      err.status = 400;
      throw err;
    }

    parsed.socialLinks = {};
    for (const [network, value] of Object.entries(body.socialLinks)) {
      if (typeof value !== "string" || value.trim().length > 2048) {
        const err = new Error(`Le lien ${network} est invalide`);
        err.status = 400;
        throw err;
      }

      const url = value.trim();
      if (url) {
        let parsedUrl;
        try {
          parsedUrl = new URL(url);
        } catch {
          const err = new Error(`Le lien ${network} doit être une URL valide`);
          err.status = 400;
          throw err;
        }
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          const err = new Error(`Le lien ${network} doit utiliser HTTP ou HTTPS`);
          err.status = 400;
          throw err;
        }
      }
      parsed.socialLinks[network] = url;
    }
  }

  return parsed;
}

export function hasAtLeastOnePaymentMethod(methods) {
  return Object.values(methods).some(Boolean);
}

export function parsePaymentMethodsPayload(body) {
  if (body === undefined) {
    return undefined;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const err = new Error("paymentMethods doit être un objet");
    err.status = 400;
    throw err;
  }

  const unknownKeys = Object.keys(body).filter(
    (key) => !ALLOWED_PAYMENT_KEYS.includes(key),
  );

  if (unknownKeys.length > 0) {
    const err = new Error(
      `Moyens de paiement inconnus : ${unknownKeys.join(", ")}`,
    );
    err.status = 400;
    throw err;
  }

  const methods = {
    fedapay: Boolean(body.fedapay),
    kkiapay: Boolean(body.kkiapay),
    cashOnDelivery: Boolean(body.cashOnDelivery),
  };

  if (!hasAtLeastOnePaymentMethod(methods)) {
    const err = new Error(
      "Activez au moins un moyen de paiement (FedaPay, KkiaPay ou paiement à la livraison)",
    );
    err.status = 400;
    throw err;
  }

  return methods;
}

export async function assertPaymentMethodEnabled(methodKey) {
  const settings = await getOrCreateSettings();
  const methods = normalizePaymentMethods(settings.paymentMethods);

  if (!methods[methodKey]) {
    const err = new Error("Ce moyen de paiement n'est pas disponible");
    err.status = 403;
    throw err;
  }
}
