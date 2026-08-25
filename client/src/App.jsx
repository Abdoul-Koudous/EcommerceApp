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
import OrderSuccess from "./pages/order-success";

// === Compte client ===

import ProfilePage from "./pages/myaccount/profilepage";
import OrdersPage from "./pages/myaccount/orderspage";
import WishlistPage from "./pages/myaccount/wishlistpage";
import SettingsPage from "./pages/myaccount/settingspage";
import LogoutPage from "./pages/myaccount/logoutpage";

import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import GuestOnlyRoute from "./components/GuestOnlyRoute/GuestOnlyRoute"; // ✅ ajouté
import AddressPage from "./pages/myaccount/AddressPage";
import AccountLayout from "./pages/myaccount/accountlayout";
import SearchPage from "./components/searchs";
import About from "./pages/about";
import Contact from "./pages/contact";
import Blog from "./pages/blog";
import BlogDetails from "./pages/blog/details";
import TrackOrder from "./pages/trackorder";
import HelpCenter from "./pages/helpcenter";
import ComparePage from "./pages/myaccount/comparepage";
import OrderDetail from "./pages/myaccount/orders/OrderDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* === FRONT CLIENT === */}
          <Route path="/" element={<Home />} />
          <Route path="/productlisting" element={<ProductListing />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetails />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/help-center" element={<HelpCenter />} />

          {/* ✅ accessibles uniquement si NON connecté */}
          <Route
            path="/login"
            element={
              <GuestOnlyRoute>
                <Login />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnlyRoute>
                <Register />
              </GuestOnlyRoute>
            }
          />

          <Route path="/cart" element={<CartPage />} />
          <Route path="/verify" element={<Verify />} />
          {/* <Route path="/forgotpassword" element={<ForgotPassword />} /> */}
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/success" element={<OrderSuccess />} />
          <Route path="/search" element={<SearchPage />} />

          {/* === COMPTE UTILISATEUR PROTÉGÉ === */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="profile" />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetail/>} /> {/* ✅ AJOUT */}
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="address" element={<AddressPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="logout" element={<LogoutPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
