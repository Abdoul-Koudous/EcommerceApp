import ShippingZoneModel from "../models/shippingZone.model.js";
import ProductModel from "../models/product.model.js";
import { getOrCreateSettings } from "./settings.service.js";

// ✅ Recherche insensible à la casse ("Cotonou" == "cotonou" == "COTONOU")
const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getShippingFeeForCity = async (city) => {
  if (!city) return null;
  const zone = await ShippingZoneModel.findOne({
    city: new RegExp(`^${escapeRegExp(city)}$`, "i"),
  });
  return zone ? zone.fee : null;
};

/**
 * Calcule les montants d'une commande à partir du panier réel et de la
 * ville de livraison. Toujours recalculé côté serveur (jamais fait
 * confiance au front) pour rester la seule source de vérité.
 *
 * Taxe : par ligne, avec possibilité d'exonération explicite par produit
 * (hasTax: false) — priorité : exonération > produit > catégorie > global.
 *
 * Livraison : UN SEUL montant pour toute la commande (pas sommé produit
 * par produit), résolu principalement par la ville de livraison —
 * priorité : exemption (hasShipping: false) > override produit > zone
 * ville > défaut global.
 *
 * @param {Array} cartItems - items du panier (doivent avoir productId, price, quantity)
 * @param {String} city - ville de l'adresse de livraison choisie
 */
export const calculateOrderTotals = async (cartItems, city) => {
  const settings = await getOrCreateSettings();

  // Récupère les données produit À JOUR (pas celles figées dans le panier)
  // pour appliquer la bonne règle de taxe/livraison au moment du paiement.
  const productIds = cartItems.map((item) => item.productId);
  const products = await ProductModel.find({
    _id: { $in: productIds },
  }).populate("category");
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  let subTotalAmt = 0;
  let taxAmt = 0;
  const pricedItems = [];

  // Produits du panier qui nécessitent réellement une livraison
  // (hasShipping !== false). Si tous les produits en sont exemptés,
  // aucun frais de livraison n'est appliqué à la commande.
  const shippableItems = [];

  for (const item of cartItems) {
    const product = productMap.get(String(item.productId));
    if (!product) {
      const error = new Error(
        "Un produit de votre panier n'est plus disponible",
      );
      error.status = 409;
      throw error;
    }

    const selectedVariants =
      item.selectedVariants instanceof Map
        ? Object.fromEntries(item.selectedVariants)
        : item.selectedVariants || {};
    const hasSelectedVariants = Object.keys(selectedVariants).length > 0;
    if (
      product.hasVariants &&
      product.useVariantStock &&
      !hasSelectedVariants
    ) {
      const error = new Error(
        "Sélectionnez une variante disponible pour ce produit",
      );
      error.status = 409;
      throw error;
    }

    let effectivePrice = product.price;
    if (hasSelectedVariants) {
      const combination = product.variantCombinations.find((candidate) => {
        const values = Object.fromEntries(candidate.combination);
        return (
          Object.keys(values).length === Object.keys(selectedVariants).length &&
          Object.entries(selectedVariants).every(
            ([name, value]) => values[name] === value,
          )
        );
      });

      if (!combination || !combination.isActive) {
        const error = new Error(
          "Une variante de votre panier n'est plus disponible",
        );
        error.status = 409;
        throw error;
      }
      if (combination.price !== null && combination.price !== undefined) {
        effectivePrice = combination.price;
      }
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
      const error = new Error("Une quantité de votre panier est invalide");
      error.status = 400;
      throw error;
    }

    const lineTotal = effectivePrice * item.quantity;
    subTotalAmt += lineTotal;
    pricedItems.push({
      ...(item.toObject ? item.toObject() : item),
      price: effectivePrice,
    });

    // 🎯 Taxe : exonération explicite > produit > catégorie > global
    if (product?.hasTax === false) {
      // aucune taxe sur cette ligne
    } else {
      let taxRate = settings.defaultTaxRate;
      if (product?.taxRate !== null && product?.taxRate !== undefined) {
        taxRate = product.taxRate;
      } else if (
        product?.category?.taxRate !== null &&
        product?.category?.taxRate !== undefined
      ) {
        taxRate = product.category.taxRate;
      }
      taxAmt += lineTotal * taxRate;
    }

    if (product?.hasShipping !== false) {
      shippableItems.push(product);
    }
  }

  // 🚚 Livraison : un seul montant pour la commande entière.
  let shippingAmt = 0;

  if (shippableItems.length > 0) {
    // Un produit peut avoir un override explicite (shippingFee défini) —
    // s'il y en a un ou plusieurs dans le panier, on prend le plus élevé
    // par prudence (évite de sous-facturer un envoi qui coûte plus cher).
    const explicitOverrides = shippableItems
      .map((p) => p.shippingFee)
      .filter((fee) => fee !== null && fee !== undefined);

    if (explicitOverrides.length > 0) {
      shippingAmt = Math.max(...explicitOverrides);
    } else {
      // Pas d'override produit → on se base sur la ville, sinon le défaut global.
      const cityFee = await getShippingFeeForCity(city);
      shippingAmt = cityFee !== null ? cityFee : settings.defaultShippingFee;
    }
  }

  const totalAmt = subTotalAmt + shippingAmt + taxAmt;

  return {
    subTotalAmt,
    shippingAmt,
    taxAmt,
    totalAmt,
    currency: settings.currency,
    pricedItems,
  };
};