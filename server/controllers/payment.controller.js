import "../config/fedapay.js"; // initialise FedaPay (clé + environnement)
import { Transaction } from "fedapay";
import crypto from "crypto";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import ProductModel from "../models/product.model.js";
import kkiapayClient from "../config/kkiapay.js";

// 📉 Décrémente le stock des produits commandés (utilisé par les trois méthodes de paiement)
const decrementStock = async (products) => {
  const bulkOps = products.map((item) => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { countIntStock: -item.quantity } },
    },
  }));

  if (bulkOps.length > 0) {
    await ProductModel.bulkWrite(bulkOps);
  }
};

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

    // 🔒 Vérification côté serveur (ne jamais faire confiance au frontend)
    const transaction = await Transaction.retrieve(transactionId);

    if (transaction.status !== "approved") {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le paiement n'a pas été approuvé",
      });
    }

    // Récupérer le panier réel de l'utilisateur
    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    const products = cartItems.map((item) => ({
      productId: item.productId,
      productTitle: item.productTitle,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    }));

    const subTotalAmt = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const shippingAmt = 500;
    const taxAmt = subTotalAmt * 0.18;
    const totalAmt = subTotalAmt + shippingAmt + taxAmt;

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentId: String(transaction.id),
      payment_status: "Payée",
      order_status: "Reçue",
      delivery_address: addressId,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    const savedOrder = await order.save();

    // 📉 Décrémenter le stock des produits commandés
    await decrementStock(products);

    // Vider le panier après commande réussie
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

// Vérification du paiement kkiapay

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

    // 🔒 Vérification côté serveur via KkiaPay
    const transaction = await kkiapayClient.verify(transactionId);

    if (transaction.status !== "SUCCESS") {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le paiement n'a pas été approuvé",
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

    const products = cartItems.map((item) => ({
      productId: item.productId,
      productTitle: item.productTitle,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    }));

    const subTotalAmt = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const shippingAmt = 500;
    const taxAmt = subTotalAmt * 0.18;
    const totalAmt = subTotalAmt + shippingAmt + taxAmt;

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentId: String(transaction.transactionId),
      payment_status: "Payée",
      order_status: "Reçue",
      delivery_address: addressId,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    const savedOrder = await order.save();

    // 📉 Décrémenter le stock des produits commandés
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

    const cartItems = await CartProductModel.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le panier est vide",
      });
    }

    const products = cartItems.map((item) => ({
      productId: item.productId,
      productTitle: item.productTitle,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    }));

    const subTotalAmt = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const shippingAmt = 500;
    const taxAmt = subTotalAmt * 0.18;
    const totalAmt = subTotalAmt + shippingAmt + taxAmt;

    const orderId = `CMD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new OrderModel({
      userId,
      orderId,
      products,
      paymentId: null,
      payment_status: "À payer à la livraison",
      order_status: "Reçue",
      delivery_address: addressId,
      subTotalAmt,
      shippingAmt,
      taxAmt,
      totalAmt,
    });

    const savedOrder = await order.save();

    // 📉 Décrémenter le stock (commande ferme, même si paiement différé)
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