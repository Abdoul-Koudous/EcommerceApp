import { createContext, useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../pages/utils/api";
import { getSessionId } from "../pages/utils/tracking";
import { ToastContext } from "../context/ToastContext";

// Création du contexte
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [myListItems, setMyListItems] = useState([]);
  const [compareItems, setCompareItems] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ distingue "session pas encore vérifiée" de "pas connecté"

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
      setLoading(false);
      return Promise.resolve(null);
    }

    return fetchDataFromApi("/api/users/user-details")
      .then((res) => {
        console.log("👤 USER API RESPONSE:", res);

        if (res?.success) {
          setUser(res.data);
          setAddresses(res.data.address_details || []);
          return res.data;
        } else {
          console.log("❌ Token invalide, nettoyage");
          localStorage.removeItem("accesstoken");
          localStorage.removeItem("refreshToken");
          setUser(null);
          setAddresses([]);
          return null;
        }
      })
      .catch((err) => {
        console.error("❌ USER ERROR:", err);
        setUser(null);
        setAddresses([]);
        return null;
      })
      .finally(() => {
        setLoading(false);
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
  // PRODUCTS
  // =========================
  const loadProducts = async () => {
    try {
      console.log("🚀 Loading products...");

      const res = await fetchDataFromApi("/api/product/getAllProducts");

      console.log("📦 RAW PRODUCTS API RESPONSE:", res);

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
      if (openToast) openToast("error", "Impossible de charger les produits");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // =========================
  // CART
  // =========================
  // ✅ MODIFIÉ : le panier est accessible sans connexion. Si l'utilisateur
  // n'est pas connecté, on envoie guestSessionId pour que le backend
  // (optionalAuth + buildOwnerFilter) retrouve le bon panier.
  //
  // ⚠️ Il n'y a plus de fonction mergeGuestCart ici : la fusion du panier
  // invité vers le compte se fait désormais directement côté serveur, dans
  // loginUserController/authWithGoogle, en une seule requête de connexion
  // (le front envoie guestSessionId dans le payload de login).
  const loadCartItems = async () => {
    try {
      const url = user?._id
        ? "/api/cart/get"
        : `/api/cart/get?guestSessionId=${getSessionId()}`;

      const res = await fetchDataFromApi(url);

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

  // =========================
  // MY LIST / FAVORIS
  // =========================
  const loadMyListItems = async () => {
    try {
      const res = await fetchDataFromApi("/api/mylist");

      console.log("❤️ MY LIST RESPONSE:", res);

      if (res?.success) {
        console.log("✅ MY LIST ITEMS:", res.data);
        setMyListItems(res.data);
      } else {
        console.log("❌ MY LIST FAILED");
      }
    } catch (err) {
      console.error("❌ MY LIST ERROR:", err);
    }
  };

  // =========================
  // COMPARE / COMPARATEUR
  // =========================
  const loadCompareItems = async () => {
    try {
      const res = await fetchDataFromApi("/api/compare");

      console.log("⚖️ COMPARE RESPONSE:", res);

      if (res?.success) {
        console.log("✅ COMPARE ITEMS:", res.data);
        setCompareItems(res.data);
      } else {
        console.log("❌ COMPARE FAILED");
      }
    } catch (err) {
      console.error("❌ COMPARE ERROR:", err);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // ✅ Le panier se charge TOUJOURS (connecté ou non), une fois que
  // loadUser a fini de vérifier la session (loading devient false).
  // Les favoris et le comparateur restent réservés aux comptes connectés.
  useEffect(() => {
    if (loading) return; // attend que loadUser ait fini son premier check

    loadCartItems();

    if (user?._id) {
      loadMyListItems();
      loadCompareItems();
    }
  }, [user, loading]);

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
        myListItems,
        loadMyListItems,
        compareItems,
        loadCompareItems,

        products,
        setProducts,
        loadProducts,

        loading,
        loadUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};