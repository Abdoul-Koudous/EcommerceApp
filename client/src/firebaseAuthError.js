const FIREBASE_AUTH_MESSAGES = {
  "auth/unauthorized-domain":
    "Ce domaine n'est pas autorisé dans Firebase Authentication. Vérifie les domaines autorisés.",
  "auth/operation-not-allowed":
    "La connexion Google n'est pas activée dans Firebase Authentication.",
  "auth/popup-blocked":
    "Le navigateur a bloqué la fenêtre Google. Autorise les fenêtres pop-up puis réessaie.",
  "auth/popup-closed-by-user": "La fenêtre Google a été fermée avant la fin.",
  "auth/cancelled-popup-request": "Une autre fenêtre de connexion Google est déjà ouverte.",
  "auth/network-request-failed":
    "La connexion à Firebase a échoué. Vérifie ta connexion Internet puis réessaie.",
  "auth/invalid-api-key":
    "La clé API Firebase configurée pour le site est invalide. Vérifie VITE_FIREBASE_API_KEY dans Render puis redéploie.",
  "auth/api-key-not-valid":
    "La clé API Firebase configurée pour le site est invalide. Vérifie VITE_FIREBASE_API_KEY dans Render puis redéploie.",
  "auth/account-exists-with-different-credential":
    "Un compte existe déjà avec cette adresse via une autre méthode de connexion.",
};

export function getFirebaseAuthErrorMessage(error) {
  return (
    FIREBASE_AUTH_MESSAGES[error?.code] ||
    `La connexion Google a échoué (${error?.code || "erreur inconnue"}). Réessaie ou transmets ce code au support.`
  );
}
