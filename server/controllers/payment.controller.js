import "../config/fedapay.js";
import { Transaction } from "fedapay";
import crypto from "crypto";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import ProductModel from "../models/product.model.js";
import AddressModel from "../models/address.model.js";
import kkiapayClient from "../config/kkiapay.js";
import { calculateOrderTotals } from "../services/pricing.service.js";

// 📉 Décrémente le stock des produits commandés (utilisé par les trois
// méthodes de paiement).
//
// ✅ NOUVEAU : si un item a une combinaison de variantes sélectionnée
// (produit avec hasVariants + useVariantStock), on décrémente AUSSI le
// stock spécifique de cette combinaison, en plus du stock global du
// produit — cohérent avec la vérification faite côté panier.
// 📉 Décrémente le stock des produits commandés (utilisé par les trois
// méthodes de paiement).
//
// ✅ Si un item a une combinaison de variantes sélectionnée (produit avec
// hasVariants + useVariantStock), on décrémente le stock de CETTE
// combinaison précise, puis on RECALCULE countIntStock comme la somme
// des stocks de toutes les combinaisons actives — countIntStock devient
// ainsi un total toujours synchronisé, jamais désynchronisé manuellement.
const decrementStock = async (products) => {
  // 1. Produits SANS variantes à stock détaillé : décrément direct classique
  const simpleBulkOps = [];

  for (const item of products) {
    const selectedVariants =
      item.selectedVariants instanceof Map
        ? Object.fromEntries(item.selectedVariants)
        : item.selectedVariants || {};

    const hasSelectedVariants =
      selectedVariants && Object.keys(selectedVariants).length > 0;

    if (!hasSelectedVariants) {
      // Produit simple ou ancien système : comportement inchangé
      simpleBulkOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { countIntStock: -item.quantity } },
        },
      });
      continue;
    }

    // 2. Produit avec variante sélectionnée : on décrémente la combinaison
    // précise, puis on recalcule countIntStock à partir de la somme des
    // combinaisons actives.
    const product = await ProductModel.findById(item.productId);
    if (!product || !product.hasVariants || !product.useVariantStock) {
      // Sécurité : si le produit a changé de configuration entre-temps,
      // on retombe sur le décrément global classique plutôt que de
      // ne rien faire.
      simpleBulkOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { countIntStock: -item.quantity } },
        },
      });
      continue;
    }

    const comboIndex = product.variantCombinations.findIndex((combo) => {
      const comboObj = Object.fromEntries(combo.combination);
      return (
        Object.keys(selectedVariants).length === Object.keys(comboObj).length &&
        Object.entries(selectedVariants).every(
          ([key, val]) => comboObj[key] === val,
        )
      );
    });

    if (comboIndex === -1) {
      console.warn(
        `Combinaison introuvable pour décrément stock — produit ${item.productId}`,
      );
      continue;
    }

    // Décrémente la combinaison précise
    await ProductModel.updateOne(
      { _id: item.productId },
      {
        $inc: {
          [`variantCombinations.${comboIndex}.stock`]: -item.quantity,
        },
      },
    );

    // ✅ Recalcule countIntStock = somme des stocks des combinaisons
    // actives, à partir de l'état FRAIS du produit (après décrément)
    const refreshedProduct = await ProductModel.findById(item.productId);
    const recalculatedStock = refreshedProduct.variantCombinations
      .filter((combo) => combo.isActive)
      .reduce((sum, combo) => sum + Math.max(0, combo.stock), 0);

    await ProductModel.updateOne(
      { _id: item.productId },
      { $set: { countIntStock: recalculatedStock } },
    );
  }

  if (simpleBulkOps.length > 0) {
    await ProductModel.bulkWrite(simpleBulkOps);
  }
};

// 📸 Résout une adresse du carnet de l'utilisateur et renvoie un snapshot
// prêt à être stocké tel quel dans order.delivery_address.
const resolveDeliverySnapshot = async (userId, addressId) => {
  const addressDoc = await AddressModel.findOne({ _id: addressId, userId });

  if (!addressDoc) {
    return null;
  }

  return {
    addressId: addressDoc._id,
    name: addressDoc.name,
    mobile: addressDoc.mobile,
    address_line1: addressDoc.address_line1,
    landmark: addressDoc.landmark,
    city: addressDoc.city,
    state: addressDoc.state,
    pincode: addressDoc.pincode,
    country: addressDoc.country,
    addressType: addressDoc.addressType,
  };
};

// ✅ NOUVEAU : helper partagé pour transformer un item de panier en ligne
// de commande, en incluant la variante sélectionnée.
const mapCartItemToOrderProduct = (item) => ({
  productId: item.productId,
  productTitle: item.productTitle,
  image: item.image,
  price: item.price,
  quantity: item.quantity,
  selectedVariants: item.selectedVariants || {},
  selectedCombinationSku: item.selectedCombinationSku || "",
});

export const verifyPaymentController = async (req, res) => {
  try {
    const userId = req.userId;
    const { transactionId, addressId } = req.body;

    if (!transactionId || !addressId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "transactionId et addressId sont requis",
      });
    }

    const transaction = await Transaction.retrieve(transactionId);

    if (transaction.status !== "approved") {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le paiement n'a pas été approuvé",
      });
    }

    const delivery_address = await resolveDeliverySnapshot(userId, addressId);

    if (!delivery_address) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Adresse de livraison introuvable",
      });
    }

    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    // ✅ MODIFIÉ : inclut selectedVariants / selectedCombinationSku
    const products = cartItems.map(mapCartItemToOrderProduct);

    const { subTotalAmt, shippingAmt, taxAmt, totalAmt } =
      await calculateOrderTotals(cartItems, delivery_address.city);

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentId: String(transaction.id),
      payment_status: "Payée",
      order_status: "Reçue",
      delivery_address,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    const savedOrder = await order.save();

    await decrementStock(products);

    await CartProductModel.deleteMany({ userId });

    return res.status(200).json({
      error: false,
      success: true,
      message: "Paiement confirmé, commande créée avec succès",
      data: savedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la vérification du paiement",
      data: error.message,
    });
  }
};

export const verifyKkiapayPaymentController = async (req, res) => {
  try {
    const userId = req.userId;
    const { transactionId, addressId } = req.body;

    if (!transactionId || !addressId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "transactionId et addressId sont requis",
      });
    }

    const transaction = await kkiapayClient.verify(transactionId);

    if (transaction.status !== "SUCCESS") {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le paiement n'a pas été approuvé",
      });
    }

    const delivery_address = await resolveDeliverySnapshot(userId, addressId);

    if (!delivery_address) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Adresse de livraison introuvable",
      });
    }

    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    // ✅ MODIFIÉ
    const products = cartItems.map(mapCartItemToOrderProduct);

    const { subTotalAmt, shippingAmt, taxAmt, totalAmt } =
      await calculateOrderTotals(cartItems, delivery_address.city);

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentId: String(transaction.transactionId),
      payment_status: "Payée",
      order_status: "Reçue",
      delivery_address,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    const savedOrder = await order.save();

    await decrementStock(products);

    await CartProductModel.deleteMany({ userId });

    return res.status(200).json({
      error: false,
      success: true,
      message: "Paiement confirmé, commande créée avec succès",
      data: savedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la vérification du paiement KkiaPay",
      data: error.message,
    });
  }
};

export const createCashOnDeliveryOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "addressId est requis",
      });
    }

    const delivery_address = await resolveDeliverySnapshot(userId, addressId);

    if (!delivery_address) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Adresse de livraison introuvable",
      });
    }

    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    // ✅ MODIFIÉ
    const products = cartItems.map(mapCartItemToOrderProduct);

    const { subTotalAmt, shippingAmt, taxAmt, totalAmt } =
      await calculateOrderTotals(cartItems, delivery_address.city);

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentId: null,
      payment_status: "À payer à la livraison",
      order_status: "Reçue",
      delivery_address,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    const savedOrder = await order.save();

    await decrementStock(products);

    await CartProductModel.deleteMany({ userId });

    return res.status(200).json({
      error: false,
      success: true,
      message: "Commande créée avec succès. Vous paierez à la livraison.",
      data: savedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la création de la commande",
      data: error.message,
    });
  }
};

export const getOrderPreviewController = async (req, res) => {
  try {
    const userId = req.userId;
    const { city } = req.query;

    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(200).json({
        error: false,
        success: true,
        subTotalAmt: 0,
        shippingAmt: 0,
        taxAmt: 0,
        totalAmt: 0,
        currency: "FCFA",
      });
    }

    const totals = await calculateOrderTotals(cartItems, city);

    return res.status(200).json({
      error: false,
      success: true,
      ...totals,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors du calcul du total",
      data: error.message,
    });
  }
};