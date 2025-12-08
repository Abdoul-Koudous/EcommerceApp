import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error("⚠️ Veuillez définir MONGODB_URI dans votre fichier .env");
}

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "ecommerceApp", // nom de la base
    });
    console.log("✅ Connecté à MongoDB avec succès");
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB :", error.message);
    process.exit(1);
  }
}

export default connectDb;
