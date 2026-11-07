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
let googleCompletionPromise;

export function startGoogleSignIn() {
  return signInWithRedirect(auth, googleProvider);
}

export function completeGoogleSignIn() {
  if (!googleCompletionPromise) {
    googleCompletionPromise = getRedirectResult(auth).then(async (result) => {
      if (!result) return null;

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
    });
  }

  return googleCompletionPromise;
}
