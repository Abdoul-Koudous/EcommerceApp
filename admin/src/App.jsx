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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === Pages avec layout admin === */}
        <Route
          path="/"
          element={
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/products/lists"
          element={
            <AdminLayout>
              <Products />
            </AdminLayout>
          }
        />
        <Route
          path="/products/add"
          element={
            <AdminLayout>
              <AddProduct />
            </AdminLayout>
          }
        />
        <Route
          path="/product/:id"
          element={
            <AdminLayout>
              <ProductDetails />
            </AdminLayout>
          }
        />
        <Route
          path="/categories/lists"
          element={
            <AdminLayout>
              <CategoriesPage/>
            </AdminLayout>
          }
        />
        <Route
          path="/subCategories/lists"
          element={
            <AdminLayout>
              <SubCategoriesPage/>
            </AdminLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <AdminLayout>
              <Profile/>
            </AdminLayout>
          }
        />

        {/* === Pages publiques === */}
        <Route path="/login" element={<AuthPage defaultForm="login" />} />
        <Route path="/register" element={<AuthPage defaultForm="register" />} />
        <Route path="/otp" element={<AuthPage defaultForm="otp" />} />
        <Route path="/reset-password" element={<AuthPage defaultForm="reset" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
