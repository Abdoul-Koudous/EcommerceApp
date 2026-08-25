// server/services/stock.service.js
import ProductModel from "../models/product.model.js";

// ────────────────────────────────────────────────────────────
// Helper interne partagé : retrouve l'index d'une combinaison de variante
// exacte dans product.variantCombinations, à partir d'une sélection donnée.
// ────────────────────────────────────────────────────────────
function findCombinationIndex(product, selectedVariants) {
  return product.variantCombinations.findIndex((combo) => {
    const comboObj = Object.fromEntries(combo.combination);
    return (
      Object.keys(selectedVariants).length === Object.keys(comboObj).length &&
      Object.entries(selectedVariants).every(
        ([key, val]) => comboObj[key] === val,
      )
    );
  });
}

// ────────────────────────────────────────────────────────────
// Recalcule countIntStock = somme des stocks des combinaisons actives,
// à partir de l'état FRAIS du produit — appelé après tout décrément/
// restitution sur un produit à stock détaillé par variante.
// ────────────────────────────────────────────────────────────
async function recalculateGlobalStock(productId) {
  const refreshedProduct = await ProductModel.findById(productId);
  if (!refreshedProduct) return;

  const recalculatedStock = refreshedProduct.variantCombinations
    .filter((combo) => combo.isActive)
    .reduce((sum, combo) => sum + Math.max(0, combo.stock), 0);

  await ProductModel.updateOne(
    { _id: productId },
    { $set: { countIntStock: recalculatedStock } },
  );
}

// ────────────────────────────────────────────────────────────
// ✅ Décrémente le stock des produits commandés (déplacé depuis
// payment.controller.js pour être partagé/réutilisable). Gère le stock
// global ET le stock par combinaison de variante.
// ────────────────────────────────────────────────────────────
export async function decrementStock(products) {
  const simpleBulkOps = [];

  for (const item of products) {
    const selectedVariants =
      item.selectedVariants instanceof Map
        ? Object.fromEntries(item.selectedVariants)
        : item.selectedVariants || {};

    const hasSelectedVariants =
      selectedVariants && Object.keys(selectedVariants).length > 0;

    if (!hasSelectedVariants) {
      simpleBulkOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { countIntStock: -item.quantity } },
        },
      });
      continue;
    }

    const product = await ProductModel.findById(item.productId);
    if (!product || !product.hasVariants || !product.useVariantStock) {
      simpleBulkOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { countIntStock: -item.quantity } },
        },
      });
      continue;
    }

    const comboIndex = findCombinationIndex(product, selectedVariants);

    if (comboIndex === -1) {
      console.warn(
        `Combinaison introuvable pour décrément stock — produit ${item.productId}`,
      );
      continue;
    }

    await ProductModel.updateOne(
      { _id: item.productId },
      {
        $inc: {
          [`variantCombinations.${comboIndex}.stock`]: -item.quantity,
        },
      },
    );

    await recalculateGlobalStock(item.productId);
  }

  if (simpleBulkOps.length > 0) {
    await ProductModel.bulkWrite(simpleBulkOps);
  }
}

// ────────────────────────────────────────────────────────────
// ✅ Fonction inverse : restitue le stock d'une commande annulée (ou
// "dé-annulée" en sens inverse via decrementStock). Miroir exact de
// decrementStock, mêmes règles, signe opposé.
// ────────────────────────────────────────────────────────────
export async function restoreStock(products) {
  const simpleBulkOps = [];

  for (const item of products) {
    const selectedVariants =
      item.selectedVariants instanceof Map
        ? Object.fromEntries(item.selectedVariants)
        : item.selectedVariants || {};

    const hasSelectedVariants =
      selectedVariants && Object.keys(selectedVariants).length > 0;

    if (!hasSelectedVariants) {
      simpleBulkOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { countIntStock: item.quantity } },
        },
      });
      continue;
    }

    const product = await ProductModel.findById(item.productId);
    if (!product || !product.hasVariants || !product.useVariantStock) {
      simpleBulkOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { countIntStock: item.quantity } },
        },
      });
      continue;
    }

    const comboIndex = findCombinationIndex(product, selectedVariants);

    if (comboIndex === -1) {
      console.warn(
        `Combinaison introuvable pour restitution stock — produit ${item.productId}`,
      );
      continue;
    }

    await ProductModel.updateOne(
      { _id: item.productId },
      {
        $inc: {
          [`variantCombinations.${comboIndex}.stock`]: item.quantity,
        },
      },
    );

    await recalculateGlobalStock(item.productId);
  }

  if (simpleBulkOps.length > 0) {
    await ProductModel.bulkWrite(simpleBulkOps);
  }
}