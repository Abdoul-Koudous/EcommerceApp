// 📁 controllers/order.controller.js

import { findOrders } from "../services/order.service.js";
import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import TrackingEventModel from "../models/trackingEvent.model.js";
import { decrementStock, restoreStock } from "../services/stock.service.js";

export const getOrderDetailsController = async (req, res) => {
  try {
    const { orders } = await findOrders({ userId: req.userId, perPage: 1000 });

    res.status(200).json({
      error: false,
      success: true,
      message: "Détails des commandes récupérés avec succès",
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la récupération des commandes",
      data: error.message,
    });
  }
};

export const getAllOrdersAdminController = async (req, res) => {
  try {
    const {
      order_status = "",
      payment_status = "",
      search = "",
      dateFrom = "",
      dateTo = "",
      page = 1,
      perPage = 10,
    } = req.query;

    const { orders, total } = await findOrders({
      order_status,
      payment_status,
      search,
      dateFrom,
      dateTo,
      page: Number(page),
      perPage: Number(perPage),
    });

    res.status(200).json({
      error: false,
      success: true,
      message: "Toutes les commandes récupérées avec succès",
      data: orders,
      total,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la récupération des commandes",
      data: error.message,
    });
  }
};

// Réservé aux ADMIN (voir middleware adminAuth sur la route)
// Met à jour uniquement le statut logistique (order_status) d'une commande.
export const updateOrderStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const allowedStatuses = [
      "Reçue",
      "En préparation",
      "Expédiée",
      "Livrée",
      "Annulée",
    ];

    if (!allowedStatuses.includes(order_status)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Statut invalide",
      });
    }

    const existingOrder = await OrderModel.findById(id);
    if (!existingOrder) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Commande introuvable",
      });
    }

    const wasDelivered = existingOrder.order_status === "Livrée";
    const willBeDelivered = order_status === "Livrée";
    const wasCancelled = existingOrder.order_status === "Annulée";
    const willBeCancelled = order_status === "Annulée";
    const wasPendingPayment =
      existingOrder.payment_status === "À payer à la livraison";

    // ✅ Si une commande "à payer à la livraison" est effectivement livrée,
    // l'argent est considéré comme encaissé → payment_status devient "Payée".
    const setFields = { order_status };
    if (willBeDelivered && wasPendingPayment) {
      setFields.payment_status = "Payée";
    }

    const updated = await OrderModel.findByIdAndUpdate(
      id,
      {
        $set: setFields,
        $push: { statusHistory: { status: order_status, date: new Date() } },
      },
      { new: true }
    ).populate("userId", "name email mobile");

    if (!wasDelivered && willBeDelivered) {
      const bulkOps = updated.products
        .filter((p) => p.productId)
        .map((p) => ({
          updateOne: {
            filter: { _id: p.productId },
            update: { $inc: { sale: p.quantity || 1 } },
          },
        }));

      if (bulkOps.length > 0) {
        await ProductModel.bulkWrite(bulkOps);
      }
    }

    if (wasDelivered && !willBeDelivered) {
      const bulkOps = updated.products
        .filter((p) => p.productId)
        .map((p) => ({
          updateOne: {
            filter: { _id: p.productId },
            update: { $inc: { sale: -(p.quantity || 1) } },
          },
        }));

      if (bulkOps.length > 0) {
        await ProductModel.bulkWrite(bulkOps);
      }
    }

    // ✅ Commande "à payer à la livraison" venant d'être effectivement
    // livrée → on confirme le(s) event(s) PURCHASE en attente. Ils
    // rejoignent alors les Analytics avec leur source/canal d'origine,
    // déjà enregistrés au moment de la commande (gère bien les variantes,
    // puisque l'attribution est indépendante de la sélection produit).
    if (willBeDelivered && wasPendingPayment) {
      await TrackingEventModel.updateMany(
        { orderId: updated.orderId, type: "PURCHASE" },
        { $set: { confirmed: true } },
      );
    }

    // ✅ Commande QUI VIENT D'ÊTRE annulée (transition, pas déjà annulée
    // avant) → on restitue le stock (global ET par combinaison de variante)
    // ET on invalide les events PURCHASE déjà trackés.
    if (!wasCancelled && willBeCancelled) {
      await restoreStock(updated.products);

      await TrackingEventModel.updateMany(
        { orderId: updated.orderId, type: "PURCHASE" },
        { $set: { voided: true } },
      );
    }

    // ✅ Cas inverse (rare) : une commande annulée par erreur est
    // "dé-annulée" → on redécrémente le stock (variantes comprises) et on
    // réactive le tracking, pour rester symétrique.
    if (wasCancelled && !willBeCancelled) {
      await decrementStock(updated.products);

      await TrackingEventModel.updateMany(
        { orderId: updated.orderId, type: "PURCHASE" },
        { $set: { voided: false } },
      );
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: "Statut de la commande mis à jour",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      data: error.message,
    });
  }
};

export const trackOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId?.trim()) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Numéro de commande requis",
      });
    }

    const order = await OrderModel.findOne({ orderId: orderId.trim() });

    if (!order) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Aucune commande trouvée avec ce numéro",
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: "Commande trouvée",
      data: {
        orderId: order.orderId,
        order_status: order.order_status,
        statusHistory: order.statusHistory,
        delivery_address: order.delivery_address,
        products: order.products,
        totalAmt: order.totalAmt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la récupération de la commande",
      data: error.message,
    });
  }
};

// 📁 controllers/order.controller.js — AJOUT

// ✅ NOUVEAU : récupère UNE commande précise, réservé au propriétaire de la
// commande (vérifie userId === req.userId, contrairement à trackOrderController
// qui est public et ne fait aucune vérification de propriété).
export const getOrderByIdController = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await OrderModel.findOne({
      orderId: orderId.trim(),
      userId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Commande introuvable",
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: "Commande récupérée avec succès",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la récupération de la commande",
      data: error.message,
    });
  }
};