import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const APP_NAME = "ecommerce-google-auth";

function authError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

function configurationError() {
  return authError(
    "Firebase Admin authentication is not configured correctly.",
    503,
    "firebase-auth/configuration",
  );
}

export function normalizeGoogleIdentity(claims) {
  if (
    !claims ||
    claims.firebase?.sign_in_provider !== "google.com" ||
    claims.email_verified !== true ||
    typeof claims.email !== "string" ||
    !claims.email.trim() ||
    typeof claims.uid !== "string" ||
    !claims.uid
  ) {
    throw authError(
      "A verified Google sign-in is required.",
      401,
      "firebase-auth/invalid-identity",
    );
  }

  return {
    uid: claims.uid,
    email: claims.email.trim().toLowerCase(),
    name: typeof claims.name === "string" ? claims.name.trim() : "",
    avatar: typeof claims.picture === "string" ? claims.picture : "",
    mobile: typeof claims.phone_number === "string" ? claims.phone_number : "",
  };
}

function getFirebaseApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!projectId || !serviceAccountJson) {
    throw configurationError();
  }

  const existingApp = getApps().find((app) => app.name === APP_NAME);
  if (existingApp) return existingApp;

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw configurationError();
  }

  if (
    !serviceAccount ||
    serviceAccount.project_id !== projectId ||
    typeof serviceAccount.client_email !== "string" ||
    typeof serviceAccount.private_key !== "string"
  ) {
    throw configurationError();
  }

  try {
    return initializeApp(
      {
        credential: cert(serviceAccount),
        projectId,
      },
      APP_NAME,
    );
  } catch {
    throw configurationError();
  }
}

export async function verifyGoogleIdToken(idToken) {
  if (typeof idToken !== "string" || !idToken.trim()) {
    throw authError(
      "A Firebase ID token is required.",
      401,
      "firebase-auth/missing-token",
    );
  }

  const app = getFirebaseApp();
  let claims;
  try {
    claims = await getAuth(app).verifyIdToken(idToken);
  } catch (error) {
    const invalidTokenCodes = new Set([
      "auth/invalid-id-token",
      "auth/id-token-expired",
      "auth/argument-error",
    ]);
    if (invalidTokenCodes.has(error?.code)) {
      throw authError(
        "The Firebase ID token is invalid or expired.",
        401,
        "firebase-auth/invalid-token",
      );
    }
    throw authError(
      "Firebase could not verify the ID token.",
      503,
      "firebase-auth/verification-unavailable",
    );
  }

  return normalizeGoogleIdentity(claims);
}
