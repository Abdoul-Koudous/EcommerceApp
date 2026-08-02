import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.scss";
// Pages
import Dashboard from "./pages/Dashboard";
import Products from "./pages/products";
import AddProduct from "./pages/products/addproduct";
import AdminLayout from "./components/layouts/AdminLayout";
import AuthPage from "./pages/AuthPage/AuthPage";
import Profile from "./pages/Profile";
import CategoriesPage from "./pages/Categorie";
import SubCategoriesPage from "./pages/SubCategoriesPage/SubCategoriesPage";
import ProductDetails from "./pages/products/productDetails";
import AddRAMs from "./pages/products/addRAMs";
import AddWEIGHT from "./pages/products/addWEIGHT";
import AddSIZE from "./pages/products/addSIZE";
import HomeSlidePage from "./pages/HomeSliderBanners";
import BannerV1List from "./pages/Banners";
import BlogList from "./pages/blog";
import Users from "./pages/Users/Users";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        {/* === Pages avec layout admin (protégées) === */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/slides/lists"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <HomeSlidePage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/banners/lists"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <BannerV1List />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/lists"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Products />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/blogs/lists"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <BlogList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/RAM/add"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AddRAMs />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/WEIGHT/add"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AddWEIGHT />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/SIZE/add"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AddSIZE />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductDetails />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/lists"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CategoriesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subCategories/lists"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <SubCategoriesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Profile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* === Pages publiques (non protégées) === */}
        <Route path="/login" element={<AuthPage defaultForm="login" />} />
        <Route path="/register" element={<AuthPage defaultForm="register" />} />
        <Route path="/otp" element={<AuthPage defaultForm="otp" />} />
        <Route
          path="/reset-password"
          element={<AuthPage defaultForm="reset" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;