import "../config/fedapay.js";
import { Transaction } from "fedapay";
import crypto from "crypto";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import ProductModel from "../models/product.model.js";
import AddressModel from "../models/address.model.js";
import kkiapayClient from "../config/kkiapay.js";
import { calculateOrderTotals } from "../services/pricing.service.js";
import { decrementStock } from "../services/stock.service.js"; // ✅ MODIFIÉ : importé, plus défini localement — partagé avec order.controller.js (restoreStock/decrementStock symétriques)

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

// ✅ Helper partagé pour transformer un item de panier en ligne de
// commande, en incluant la variante sélectionnée.
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

    // 📉 Décrémenter le stock (commande ferme, même si paiement différé) —
    // ⚠️ le stock est bien retiré immédiatement à la commande, PAS à la
    // livraison. Ce qui change avec notre correction, c'est uniquement le
    // moment où l'event PURCHASE compte dans les Analytics (confirmed:
    // false ici, confirmé plus tard côté order.controller.js quand
    // order_status passe à "Livrée"). Le stock, lui, reste réservé dès la
    // commande — cohérent avec "commande ferme" même si le paiement est différé.
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
    const { city } = req.query;

    // ✅ MODIFIÉ : supporte le panier invité, comme cart.controller.js —
    // sinon le total reste à 0 pour un visiteur non connecté.
    const ownerFilter = req.userId
      ? { userId: req.userId }
      : req.query.guestSessionId
        ? { guestSessionId: req.query.guestSessionId }
        : null;

    if (!ownerFilter) {
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

    const cartItems = await CartProductModel.find(ownerFilter);

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