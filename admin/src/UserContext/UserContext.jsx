import { createContext, useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { ToastContext } from "../context/ToastContext"; // pour les messages si nécessaire

// Création du contexte
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [categories, setCategories] = useState([]); // <- AJOUTÉ pour AddProduct
  const [loading, setLoading] = useState(true); // ✅ distingue "session pas encore vérifiée" de "pas connecté"
  const { openToast } = useContext(ToastContext); // facultatif, pour messages

  // Charger les informations de l'utilisateur
  const loadUser = () => {
    const token = localStorage.getItem("accesstoken");

    if (!token) {
      setUser(null);
      setAddresses([]);
      setLoading(false);
      return Promise.resolve(); // ✅ pour pouvoir faire "await loadUser()" même dans ce cas
    }

    return fetchDataFromApi("/api/users/user-details") // ✅ return ajouté : loadUser renvoie maintenant la Promise
      .then((res) => {
        if (res?.success) {
          setUser(res.data);
          setAddresses(res.data.address_details || []);
        } else {
          // ✅ token invalide/expiré (401 etc.) : on efface l'état au lieu de le laisser périmé,
          // sinon un ancien `user` en mémoire continue de faire croire à une session valide
          setUser(null);
          setAddresses([]);
        }
      })
      .catch(() => {
        setUser(null);
        setAddresses([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Charger les catégories depuis le backend (1 fois)
  const loadCategories = () => {
    fetchDataFromApi("/api/category")
      .then((res) => {
        if (res?.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => {
        console.error("Erreur chargement catégories :", err);
        if (openToast) openToast("error", "Impossible de charger les catégories");
      });
  };

  useEffect(() => {
    loadUser();
    loadCategories(); // 🔹 Charger catégories automatiquement
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        addresses,
        setAddresses,
        categories,     // ✅ pour AddProduct
        setCategories,  // ✅ pour AddProduct
        loading,        // ✅ pour ProtectedRoute — attendre avant de décider d'une redirection
        loadUser,
        loadCategories, // possibilité de recharger à volonté
      }}
    >
      {children}
    </UserContext.Provider>
  );
};