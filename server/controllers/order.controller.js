import { findOrders } from "../services/order.service.js";
import OrderModel from "../models/order.model.js";

export const getOrderDetailsController = async (req, res) => {
  try {
    // Côté client on ne pagine pas (l'historique perso reste complet) :
    // perPage volontairement large pour ne pas changer ce comportement existant.
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

// Réservé aux ADMIN (voir middleware adminAuth sur la route)
// Filtres via req.query : order_status, payment_status, search, dateFrom, dateTo, page, perPage
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

    // delivery_address est désormais un sous-document embarqué (snapshot figé),
    // il n'y a donc plus rien à populate dessus. Seul userId reste une vraie
    // référence vers le compte qui a passé la commande.
    const updated = await OrderModel.findByIdAndUpdate(
      id,
      { order_status },
      { new: true }
    ).populate("userId", "name email mobile");

    if (!updated) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Commande introuvable",
      });
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