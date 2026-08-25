import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDb.js";
import userRouter from './route/user.route.js'
import categoryRouter from "./route/category.route.js";
import productRouter from "./route/product.route.js";
import cartRouter from "./route/cart.route.js";
import myListRouter from "./route/mylist.route.js";
import addressRouter from "./route/address.route.js";
import homeSlideRouter from "./route/homeSlide.route.js";
import bannerV1Router from "./route/bannerV1.route.js";
import blogRouter from "./route/blog.route.js";
import orderRouter from "./route/order.route.js";
import paymentRouter from "./route/payment.route.js";
import dashboardRouter from "./route/dashboard.route.js";
import aboutPageRouter from "./route/aboutPage.route.js";
import contactPageRouter from "./route/contactPage.route.js";
import contactMessageRouter from "./route/contactMessage.route.js";
import settingsRouter from "./route/settings.route.js";
import shippingZoneRouter from "./route/shippingZone.route.js";
import campaignRouter from "./route/campaign.route.js";
import shortLinkRouter from "./route/shortLink.route.js";
import socialContentRouter from "./route/socialContent.route.js";
import helpFaqRouter from "./route/helpFaq.route.js";




dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ derrière un reverse proxy (Nginx en prod) : nécessaire pour que req.secure,
// les IP clientes réelles, et les cookies "secure" se comportent correctement
app.set("trust proxy", 1);

// ✅ liste blanche d'origines — CLIENT_URL/ADMIN_URL à définir dans .env
// (ex: "https://yeboushop.com,https://admin.yeboushop.com")
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Autorise les requêtes sans origine (ex: Postman, requêtes serveur-à-serveur)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Non autorisé par la politique CORS"));
  },
  credentials: true, // ✅ nécessaire pour les cookies httpOnly (accessToken/refreshToken)
};

// 🧩 Middlewares globaux
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ ajouté par sécurité, en plus de json()
app.use(cookieParser());

// ✅ logs plus légers en prod, verbeux en dev uniquement
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ✅ Route test
app.get("/", (req, res) => {
  res.json({
    message: `🚀 Le serveur est en cours d'exécution sur le port ${PORT}`,
  });
});

app.use('/api/users', userRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/mylist', myListRouter);
app.use('/api/address', addressRouter);
app.use('/api/homeSlide', homeSlideRouter);
app.use('/api/bannerV1', bannerV1Router);
app.use('/api/blog', blogRouter);
app.use('/api/order', orderRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/about', aboutPageRouter);
app.use('/api/contact-page', contactPageRouter);
app.use('/api/contact-message', contactMessageRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/shipping-zone', shippingZoneRouter);
app.use("/api/campaign", campaignRouter);
app.use("/go", shortLinkRouter); // ex: yebou-shop.com/go/sld-aout-montre-wa
app.use('/api/social-content', socialContentRouter);
app.use('/api/help-faq', helpFaqRouter);

// ✅ 404 — route inconnue
app.use((req, res) => {
  res.status(404).json({
    error: true,
    success: false,
    message: "Route introuvable",
  });
});

// ✅ middleware d'erreur global — dernier rempart, évite toute fuite de stack trace en prod
app.use((err, req, res, next) => {
  console.error(err);

  // En prod, jamais renvoyer err.stack ou des détails internes au client
  const isProd = process.env.NODE_ENV === "production";

  res.status(err.status || 500).json({
    error: true,
    success: false,
    message: isProd ? "Erreur serveur" : err.message || "Erreur serveur",
  });
});

// 🔗 Connexion à MongoDB + Lancement du serveur
connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    // ✅ échec explicite au démarrage plutôt qu'une promesse rejetée silencieuse
    console.error("❌ Impossible de se connecter à la base de données :", err);
    process.exit(1);
  });

// docker compose -f docker-compose.prod.yml down
// docker compose -f docker-compose.prod.yml build --no-cache
// docker compose -f docker-compose.prod.yml up
