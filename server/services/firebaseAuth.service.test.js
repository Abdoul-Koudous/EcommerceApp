import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import {
  normalizeGoogleIdentity,
  verifyGoogleIdToken,
} from "./firebaseAuth.service.js";

const validGoogleClaims = {
  uid: "firebase-user-123",
  email: "Customer@Example.com",
  email_verified: true,
  name: "Customer",
  picture: "https://example.com/avatar.png",
  phone_number: "+123456789",
  firebase: { sign_in_provider: "google.com" },
};

test("normalizes identity fields from verified Google claims", () => {
  assert.deepEqual(normalizeGoogleIdentity(validGoogleClaims), {
    uid: "firebase-user-123",
    email: "customer@example.com",
    name: "Customer",
    avatar: "https://example.com/avatar.png",
    mobile: "+123456789",
  });
});

test("rejects identity claims from a non-Google provider", () => {
  assert.throws(
    () =>
      normalizeGoogleIdentity({
        ...validGoogleClaims,
        firebase: { sign_in_provider: "password" },
      }),
    { statusCode: 401, code: "firebase-auth/invalid-identity" },
  );
});

test("rejects Google identities with an unverified email", () => {
  assert.throws(
    () =>
      normalizeGoogleIdentity({
        ...validGoogleClaims,
        email_verified: false,
      }),
    { statusCode: 401, code: "firebase-auth/invalid-identity" },
  );
});

test("rejects identity claims without a verified email", () => {
  assert.throws(
    () =>
      normalizeGoogleIdentity({
        ...validGoogleClaims,
        email: undefined,
      }),
    { statusCode: 401, code: "firebase-auth/invalid-identity" },
  );
});

test("rejects a missing ID token", async () => {
  await assert.rejects(verifyGoogleIdToken(), {
    statusCode: 401,
    code: "firebase-auth/missing-token",
  });
});

test("fails closed when Firebase Admin credentials are missing", async () => {
  const previousProjectId = process.env.FIREBASE_PROJECT_ID;
  const previousServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  try {
    await assert.rejects(verifyGoogleIdToken("test-token"), {
      statusCode: 503,
      code: "firebase-auth/configuration",
    });
  } finally {
    if (previousProjectId === undefined) {
      delete process.env.FIREBASE_PROJECT_ID;
    } else {
      process.env.FIREBASE_PROJECT_ID = previousProjectId;
    }
    if (previousServiceAccount === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = previousServiceAccount;
    }
  }
});

test("rejects a malformed token through Firebase Admin verification", async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const previousProjectId = process.env.FIREBASE_PROJECT_ID;
  const previousServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  process.env.FIREBASE_PROJECT_ID = "test-project";
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    project_id: "test-project",
    client_email: "firebase-admin@test-project.iam.gserviceaccount.com",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
  });

  try {
    await assert.rejects(verifyGoogleIdToken("not-a-firebase-token"), {
      statusCode: 401,
      code: "firebase-auth/invalid-token",
    });
  } finally {
    if (previousProjectId === undefined) {
      delete process.env.FIREBASE_PROJECT_ID;
    } else {
      process.env.FIREBASE_PROJECT_ID = previousProjectId;
    }
    if (previousServiceAccount === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = previousServiceAccount;
    }
  }
});
