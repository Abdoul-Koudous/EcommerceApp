import OrderModel from "../models/order.model.js";
import crypto from "crypto";

export const getOrderDetailsController = async (req, res) => {
  try {
    const userId = req.userId;

    const orderlist = await OrderModel.find({ userId })
      .sort({ createdAt: -1 })
      .populate("delivery_address");

    res.status(200).json({
      error: false,
      success: true,
      message: "Détails des commandes récupérés avec succès",
      data: orderlist,
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
// Renvoie les commandes de TOUS les utilisateurs, avec les infos client + adresse populées
export const getAllOrdersAdminController = async (req, res) => {
  try {
    const orderlist = await OrderModel.find({})
      .sort({ createdAt: -1 })
      .populate("delivery_address")
      .populate("userId", "name email mobile");

    res.status(200).json({
      error: false,
      success: true,
      message: "Toutes les commandes récupérées avec succès",
      data: orderlist,
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