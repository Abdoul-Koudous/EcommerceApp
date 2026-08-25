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
import Users from "./pages/Users/Users";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AboutPage from "./pages/AboutPage/AboutPage";
import ContactPage from "./pages/ContactPage/ContactPage";
import ContactMessages from "./pages/ContactMessages/ContactMessages";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings/Settings";
import Campaigns from "./pages/Campaigns/Campaigns";
import Analytics from "./pages/Analytics/Analytics";
import HelpFaqList from "./pages/help-faq/HelpFaqList";


// ✅ AJOUT : import manquant — BlogList gère elle-même l'ouverture
// des modales AddBlog / EditBlog, donc pas besoin de les importer ici
import BlogList from "./pages/blog";

function App() {
  return (
    <BrowserRouter>
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
          path="/analytics"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Analytics />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
  path="/help-faq/lists"
  element={
    <ProtectedRoute>
      <AdminLayout>
        <HelpFaqList />
      </AdminLayout>
    </ProtectedRoute>
  }
/>

        {/* === Blog : une seule route, Add/Edit s'ouvrent en modale === */}
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
        {/* ❌ SUPPRIMÉ : /blog/add et /blog/edit/:id — plus utilisées,
            AddBlog et EditBlog sont maintenant des modales ouvertes
            depuis BlogList, comme AddProduct/EditProduct pour Products */}

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

        {/* === Pages du site (À propos / Contact) === */}
        <Route
          path="/about-page"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AboutPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact-page"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ContactPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact-messages"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ContactMessages />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Orders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Campaigns />
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