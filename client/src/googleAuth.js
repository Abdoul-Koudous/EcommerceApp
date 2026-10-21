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
      const fields = {
        name: user.displayName || user.email,
        email: user.email,
        password: null,
        avatar: user.photoURL,
        mobile: user.phoneNumber,
        role: "UTILISATEUR",
        guestSessionId: getSessionId(),
      };

      if (!fields.email) {
        throw new Error("Google n'a pas fourni d'adresse e-mail pour ce compte.");
      }

      const response = await postData("/api/users/authWithGoogle", fields);
      if (
        response?.error ||
        !response?.success ||
        !response?.data?.accesstoken
      ) {
        throw new Error(
          response?.message || "Le serveur a refusé la connexion Google.",
        );
      }

      localStorage.setItem("userEmail", fields.email);
      localStorage.setItem("accesstoken", response.data.accesstoken);
      localStorage.setItem("refreshToken", response.data.refreshToken);

      return {
        message: response.message,
        email: fields.email,
      };
    });
  }

  return googleCompletionPromise;
}
