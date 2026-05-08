import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";
import userRouter from './route/user.route.js'
import categoryRouter from "./route/category.route.js";
import productRouter from "./route/product.route.js";
import cartRouter from "./route/cart.route.js";
import myListRouter from "./route/mylist.route.js";
import addressRouter from "./route/address.route.js";
import homeSlideRouter from "./route/homeSlide.route.js";
import bannerV1Router from "./route/bannerV1.route.js";
import blogRouter from "./route/blog.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 🧩 Middlewares globaux
app.use(cors());
// app.options("*", cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
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

// 🔗 Connexion à MongoDB + Lancement du serveur
connectDB().then(() => {
  app.listen(PORT, "0.0.0.0",() => {
    console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
  });
});
// docker compose -f docker-compose.prod.yml down
// docker compose -f docker-compose.prod.yml build --no-cache
// docker compose -f docker-compose.prod.yml up