import { createContext, useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { ToastContext } from "../context/ToastContext";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  const { openToast } = useContext(ToastContext) || {};

  // 🔥 Charger utilisateur
  const loadUser = async () => {
    const token = localStorage.getItem("accesstoken");

    if (!token) {
      setUser(null);
      setAddresses([]);
      return;
    }

    try {
      setLoading(true);

      const res = await fetchDataFromApi("/api/users/user-details");

      if (res?.error) {
        setUser(null);
        setAddresses([]);
        if (openToast) openToast("error", res.message);
        return;
      }

      if (res?.success) {
        setUser(res.data);
        setAddresses(res.data?.address_details || []);
      }

    } catch (error) {
      console.log(error);
      setUser(null);
      setAddresses([]);
      if (openToast) openToast("error", "Erreur chargement utilisateur");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 refresh manuel
  const refreshUser = () => {
    loadUser();
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        addresses,
        setAddresses,
        loading,
        loadUser,
        refreshUser, // 🔥 pratique
      }}
    >
      {children}
    </UserContext.Provider>
  );
};