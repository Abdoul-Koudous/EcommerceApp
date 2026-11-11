export const MAX_SUPPORT_MESSAGE_LENGTH = 2000;

export const ALLOWED_SUPPORT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export function parseSupportLocation(value) {
  if (value === undefined || value === null || value === "") {
    return { location: undefined };
  }

  let location = value;
  if (typeof value === "string") {
    try {
      location = JSON.parse(value);
    } catch {
      return { error: "La position partagée est invalide" };
    }
  }

  if (!location || typeof location !== "object" || Array.isArray(location)) {
    return { error: "La position partagée est invalide" };
  }

  const { latitude, longitude, accuracy } = location;
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    (accuracy !== undefined &&
      (typeof accuracy !== "number" ||
        !Number.isFinite(accuracy) ||
        accuracy < 0))
  ) {
    return { error: "Les coordonnées de la position sont invalides" };
  }

  return {
    location: {
      latitude,
      longitude,
      ...(accuracy === undefined ? {} : { accuracy }),
    },
  };
}

export function validateSupportMessagePayload(text, files, location) {
  const message = typeof text === "string" ? text.trim() : "";

  if (message.length > MAX_SUPPORT_MESSAGE_LENGTH) {
    return {
      error: `Le message ne peut pas dépasser ${MAX_SUPPORT_MESSAGE_LENGTH} caractères`,
    };
  }
  if (!message && files.length === 0 && !location) {
    return { error: "Ajoutez un texte, une pièce jointe ou une position" };
  }

  return { text: message };
}
