import mongoose from "mongoose";
import ContactMessageModel from "../models/contactMessage.model.js";
import OrderModel from "../models/order.model.js";
import SupportConversationModel from "../models/supportConversation.model.js";

const countUnreadSupportMessages = async (match) => {
  const [result] = await SupportConversationModel.aggregate([
    { $match: match },
    { $unwind: "$messages" },
    {
      $match: {
        "messages.sender": "customer",
        "messages.seenByAdmin": false,
      },
    },
    { $count: "count" },
  ]);
  return result?.count || 0;
};

const countUnreadCustomerReplies = async (userId) => {
  const [result] = await SupportConversationModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: "$messages" },
    {
      $match: {
        "messages.sender": "admin",
        "messages.seenByCustomer": false,
      },
    },
    { $count: "count" },
  ]);
  return result?.count || 0;
};

export const getAdminNotifications = async (_req, res) => {
  try {
    const [orders, contactMessages, supportMessages] = await Promise.all([
      OrderModel.countDocuments({ order_status: "Reçue" }),
      ContactMessageModel.countDocuments({ isRead: false }),
      countUnreadSupportMessages({}),
    ]);

    return res.status(200).json({
      success: true,
      error: false,
      data: { orders, contactMessages, supportMessages },
    });
  } catch (error) {
    console.error("Erreur de chargement des notifications admin:", error.message);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Impossible de charger les notifications",
    });
  }
};

export const getCustomerNotifications = async (req, res) => {
  try {
    const [orders, supportMessages] = await Promise.all([
      OrderModel.countDocuments({
        userId: req.userId,
        customerSeenOrderStatus: { $exists: true },
        $expr: { $ne: ["$order_status", "$customerSeenOrderStatus"] },
      }),
      countUnreadCustomerReplies(req.userId),
    ]);

    return res.status(200).json({
      success: true,
      error: false,
      data: { orders, supportMessages },
    });
  } catch (error) {
    console.error("Erreur de chargement des notifications client:", error.message);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Impossible de charger vos notifications",
    });
  }
};
