import { createContext, useEffect, useState } from "react";
import { fetchDataFromApi } from "../pages/utils/api";


export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const loadUser = () => {
    const token = localStorage.getItem("accesstoken");

    if (!token) {
      setUser(null);
      return;
    }

    fetchDataFromApi("/api/users/user-details")
      .then((res) => {
        if (res?.success) {
          setUser(res.data);
        }
      })
      .catch(() => setUser(null));
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};
