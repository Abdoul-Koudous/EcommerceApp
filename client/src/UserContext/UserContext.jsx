import { createContext, useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { ToastContext } from "../context/ToastContext";

// Création du contexte
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);

  const { openToast } = useContext(ToastContext);

  // =========================
  // 🔥 DEBUG GLOBAL PRODUCTS
  // =========================
  useEffect(() => {
    console.log("📦 PRODUCTS STATE UPDATED:", products);
  }, [products]);

  // =========================
  // USER
  // =========================
  const loadUser = () => {
    const token = localStorage.getItem("accesstoken");

    if (!token) {
      console.log("❌ No token found");
      setUser(null);
      setAddresses([]);
      return;
    }

    fetchDataFromApi("/api/users/user-details")
      .then((res) => {
        console.log("👤 USER API RESPONSE:", res);

        if (res?.success) {
          setUser(res.data);
          setAddresses(res.data.address_details || []);
        }
      })
      .catch((err) => {
        console.error("❌ USER ERROR:", err);
        setUser(null);
        setAddresses([]);
      });
  };

  // =========================
  // CATEGORIES
  // =========================
  const loadCategories = () => {
    fetchDataFromApi("/api/category")
      .then((res) => {
        console.log("📂 CATEGORIES RESPONSE:", res);

        if (res?.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => {
        console.error("❌ CATEGORY ERROR:", err);
        if (openToast)
          openToast("error", "Impossible de charger les catégories");
      });
  };

  // =========================
  // PRODUCTS (🔥 CORRIGÉ ICI)
  // =========================
  const loadProducts = async () => {
    try {
      console.log("🚀 Loading products...");

      const res = await fetchDataFromApi("/api/product/getAllProducts");

      console.log("📦 RAW PRODUCTS API RESPONSE:", res);

      // 🔥 CORRECTION ICI
      if (res?.success && res?.products) {
        console.log("✅ PRODUCTS FROM BACKEND:", res.products);
        console.log("📊 NOMBRE DE PRODUITS:", res.products.length);

        setProducts(res.products);
      } else {
        console.log("❌ FORMAT INVALIDE OU PAS DE PRODUITS");
        setProducts([]);
      }
    } catch (err) {
      console.error("❌ PRODUCTS ERROR:", err);
      if (openToast)
        openToast("error", "Impossible de charger les produits");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // =========================
  // CART
  // =========================
  const loadCartItems = async () => {
    try {
      const res = await fetchDataFromApi("/api/cart/get");

      console.log("🛒 CART RESPONSE:", res);

      if (res?.success) {
        console.log("✅ CART ITEMS:", res.data);
        setCartItems(res.data);
      } else {
        console.log("❌ CART FAILED");
      }
    } catch (err) {
      console.error("❌ CART ERROR:", err);
    }
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

        categories,
        setCategories,
        loadCategories,

        cartItems,
        loadCartItems,

        products,
        setProducts,
        loadProducts,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};