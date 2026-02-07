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
          path="/products/RAM/add"
          element={
            <AdminLayout>
              <AddRAMs />
            </AdminLayout>
          }
        />
        <Route
          path="/products/WEIGHT/add"
          element={
            <AdminLayout>
              <AddWEIGHT/>
            </AdminLayout>
          }
        />
        <Route
          path="/products/SIZE/add"
          element={
            <AdminLayout>
              <AddSIZE/>
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
