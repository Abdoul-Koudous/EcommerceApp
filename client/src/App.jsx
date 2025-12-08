import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.scss";

// === Layout ===
import MainLayout from "./layouts/mainlayout";

// === Pages Client ===
import Home from "./pages/home";
import ProductListing from "./components/productlisting";
import ProductDetails from "./pages/productdetails";
import Login from "./pages/login";
import Register from "./pages/register";

import CartPage from "./pages/cart";
import Verify from "./pages/verify";
import ForgotPassword from "./pages/forgotpassword";
import ResetPassword from "./pages/resetpassword";
import Checkout from "./pages/checkout";

// === Compte client ===

import ProfilePage from "./pages/myaccount/profilepage";
import OrdersPage from "./pages/myaccount/orderspage";
import WishlistPage from "./pages/myaccount/wishlistpage";
import SettingsPage from "./pages/myaccount/settingspage";
import LogoutPage from "./pages/myaccount/logoutpage";

import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AddressPage from "./pages/myaccount/AddressPage";
import AccountLayout from "./pages/myaccount/accountlayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          
          {/* === FRONT CLIENT === */}
          <Route path="/" element={<Home />} />
          <Route path="/productlisting" element={<ProductListing />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* === COMPTE UTILISATEUR PROTÉGÉ === */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountLayout/>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="profile" />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="address" element={<AddressPage/>} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="logout" element={<LogoutPage />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
