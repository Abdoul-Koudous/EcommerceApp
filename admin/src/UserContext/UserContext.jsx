import { createContext, useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { ToastContext } from "../context/ToastContext"; // si tu veux gérer les erreurs

// Création du contexte
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const { openToast } = useContext(ToastContext); // facultatif, pour gérer les messages

  const loadUser = () => {
    const token = localStorage.getItem("accesstoken");

    if (!token) {
      setUser(null);
      setAddresses([]);
      return;
    }

    fetchDataFromApi("/api/users/user-details")
      .then((res) => {
        if (res?.success) {
          setUser(res.data);
          setAddresses(res.data.address_details || []);
        }
      })
      .catch(() => {
        setUser(null);
        setAddresses([]);
      });
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, addresses, setAddresses, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};
