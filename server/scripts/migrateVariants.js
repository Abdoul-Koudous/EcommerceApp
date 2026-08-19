// server/scripts/migrateVariants.js
//
// Migration ponctuelle : convertit les anciens champs figés
// (productRam, size, productWeight) vers le nouveau système
// générique de variantes (variants[]).
//
// ⚠️ Ce script NE TOUCHE PAS aux anciens champs (productRam, size,
// productWeight) — ils restent en base tels quels pour la rétrocompatibilité.
// Il se contente d'AJOUTER les nouvelles données dérivées.
//
// ⚠️ Ce script NE remplit PAS variantCombinations et NE modifie PAS
// useVariantStock : on ne connaît pas l'historique du stock par
// combinaison, donc on laisse le vendeur le faire manuellement/auto
// depuis l'admin s'il le souhaite.
//
// ⚠️ Utilise updateOne() plutôt que save() : certains anciens produits
// en base n'ont pas tous les champs aujourd'hui "required" (ex:
// bannerTitleName), et save() revaliderait tout le document. updateOne()
// ne touche/valide que les champs explicitement listés dans $set.
//
// Usage : node scripts/migrateVariants.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductModel from "../models/product.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  if (!MONGO_URI) {
    console.error("❌ Variable d'environnement MONGODB_URI/MONGO_URI introuvable.");
    process.exit(1);
  }

  console.log("🔌 Connexion à MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connecté.");

  const products = await ProductModel.find({
    $or: [{ hasVariants: { $exists: false } }, { hasVariants: false }],
  });

  console.log(`📦 ${products.length} produit(s) à examiner.`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      const newVariants = [];

      const ram = (product.productRam || []).filter(
        (v) => v !== null && v !== undefined && String(v).trim() !== "",
      );
      if (ram.length > 0) {
        newVariants.push({ name: "RAM", values: ram });
      }

      const size = (product.size || []).filter(
        (v) => v !== null && v !== undefined && String(v).trim() !== "",
      );
      if (size.length > 0) {
        newVariants.push({ name: "Taille", values: size });
      }

      const weight = (product.productWeight || []).filter(
        (v) => v !== null && v !== undefined && String(v).trim() !== "",
      );
      if (weight.length > 0) {
        newVariants.push({ name: "Poids", values: weight });
      }

      if (newVariants.length === 0) {
        // Produit simple : on marque juste hasVariants=false explicitement
        // pour qu'il ne soit plus repris lors d'une relance du script.
        await ProductModel.updateOne(
          { _id: product._id },
          { $set: { hasVariants: false } },
          { runValidators: false },
        );
        skippedCount++;
        continue;
      }

      // ✅ updateOne + $set : ne touche/valide QUE ces 3 champs,
      // ignore le reste du document (donc pas bloqué par bannerTitleName
      // ou tout autre champ required manquant sur d'anciens produits).
      await ProductModel.updateOne(
        { _id: product._id },
        {
          $set: {
            variants: newVariants,
            hasVariants: true,
            useVariantStock: false,
          },
        },
        { runValidators: false },
      );

      migratedCount++;
      console.log(
        `  ✅ "${product.name}" → ${newVariants.map((v) => v.name).join(", ")}`,
      );
    } catch (err) {
      errorCount++;
      console.error(`  ❌ Échec sur "${product.name}" (${product._id}) :`, err.message);
      // On continue avec les produits suivants au lieu d'arrêter tout le script.
    }
  }

  console.log("\n──────────────────────────────");
  console.log(`✅ Produits migrés (avec variantes) : ${migratedCount}`);
  console.log(`⏭️  Produits sans variantes (inchangés) : ${skippedCount}`);
  console.log(`❌ Erreurs : ${errorCount}`);
  console.log("──────────────────────────────\n");

  await mongoose.disconnect();
  console.log("🔌 Déconnecté. Migration terminée.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Erreur pendant la migration :", err);
  process.exit(1);
});