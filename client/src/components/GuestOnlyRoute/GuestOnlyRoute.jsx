import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../UserContext/UserContext";
import CircularProgress from "../CircularProgress/CircularProgress";
import "./guestOnlyRoute.scss";
import { isGoogleSignInRedirectPending } from "../../googleAuth";

// Empêche l'accès à login/register si une session est déjà active —
// évite qu'un utilisateur connecté se retrouve à re-remplir un formulaire d'auth par erreur.
const GuestOnlyRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  const googleRedirectPending = isGoogleSignInRedirectPending();

  // Tant que loadUser() n'a pas fini, on ne sait pas encore si une session existe —
  // éviter d'afficher le formulaire puis de le faire disparaître (flash).
  if (loading && !googleRedirectPending) {
    return (
      <div className="grt-loading-screen">
        <CircularProgress />
      </div>
    );
  }

  if (user?._id) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestOnlyRoute;