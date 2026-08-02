import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../UserContext/UserContext";
import CircularProgress from "../CircularProgress/CircularProgress";
import "./protectedRoute.scss";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  // Tant que loadUser() n'a pas fini, on ne sait pas encore si la session est valide —
  // afficher un écran de chargement évite un flash de "redirigé vers login" à tort
  // (et surtout évite d'afficher brièvement l'UI admin à un utilisateur non vérifié).
  if (loading) {
    return (
      <div className="prt-loading-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;