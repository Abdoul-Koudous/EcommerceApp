import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
} from "firebase/auth";
import { firebaseApp } from "./firebase";
import { getSessionId } from "./pages/utils/tracking";
import { postData } from "./pages/utils/api";

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const GOOGLE_REDIRECT_PENDING_KEY = "googleAuthRedirectPending";
let googleCompletionPromise;

export function isGoogleSignInRedirectPending() {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === "true"
  );
}

export function clearGoogleSignInRedirectPending() {
  window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
}

export function startGoogleSignIn() {
  window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "true");
  return signInWithRedirect(auth, googleProvider).catch((error) => {
    clearGoogleSignInRedirectPending();
    throw error;
  });
}

export function completeGoogleSignIn() {
  if (!googleCompletionPromise) {
    googleCompletionPromise = getRedirectResult(auth)
      .then(async (result) => {
        if (!result) {
          clearGoogleSignInRedirectPending();
          return null;
        }

        const user = result.user;
        const payload = {
          idToken: await user.getIdToken(),
          guestSessionId: getSessionId(),
        };

        const response = await postData("/api/users/authWithGoogle", payload);
        if (
          response?.error ||
          !response?.success ||
          !response?.data?.accesstoken ||
          !response?.data?.email
        ) {
          throw new Error(
            response?.message || "Le serveur a refusé la connexion Google.",
          );
        }

        localStorage.setItem("userEmail", response.data.email);
        localStorage.setItem("accesstoken", response.data.accesstoken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        return {
          message: response.message,
          email: response.data.email,
        };
      })
      .catch((error) => {
        clearGoogleSignInRedirectPending();
        googleCompletionPromise = null;
        throw error;
      });
  }

  return googleCompletionPromise;
}
