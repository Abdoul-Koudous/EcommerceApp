import OrderModel from "../models/order.model.js";
import SupportConversationModel from "../models/supportConversation.model.js";
import { uploadFromBuffer } from "../utils/cloudinaryUpload.js";
import {
  parseSupportLocation,
  validateSupportMessagePayload,
} from "../services/supportMessage.service.js";

const MAX_SUBJECT_LENGTH = 100;

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const getMessageContent = async (req) => {
  const files = req.files || [];
  const { location, error: locationError } = parseSupportLocation(
    req.body.location,
  );
  if (locationError) return { error: locationError };

  const { text, error } = validateSupportMessagePayload(
    req.body.message,
    files,
    location,
  );
  if (error) return { error };

  const attachments = await Promise.all(
    files.map(async (file) => {
      const upload = await uploadFromBuffer(
        file.buffer,
        file.originalname,
        "support",
      );
      if (!upload?.secure_url) {
        throw new Error("Cloudinary n'a pas retourné l'URL de la pièce jointe");
      }

      return {
        url: upload.secure_url,
        type: file.mimetype.startsWith("video/") ? "video" : "image",
        name: file.originalname.slice(0, 180),
      };
    }),
  );

  return { text, attachments, location };
};

const withUnreadCounts = (conversation) => {
  const data = conversation.toObject
    ? conversation.toObject()
    : conversation;
  data.unreadByAdmin = data.messages.filter(
    (message) => message.sender === "customer" && !message.seenByAdmin,
  ).length;
  data.unreadByCustomer = data.messages.filter(
    (message) => message.sender === "admin" && !message.seenByCustomer,
  ).length;
  const lastMessage = data.messages.at(-1);
  data.lastMessagePreview =
    lastMessage?.text ||
    (lastMessage?.attachments?.length
      ? "Pièce jointe"
      : Number.isFinite(lastMessage?.location?.latitude) &&
          Number.isFinite(lastMessage?.location?.longitude)
        ? "Position partagée"
        : "");
  delete data.messages;
  return data;
};

export const createCustomerConversation = async (req, res) => {
  try {
    const subject = normalizeText(req.body.subject);
    if (!subject) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Le sujet est obligatoire",
      });
    }
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return res.status(400).json({
        error: true,
        success: false,
        message: `Le sujet ne peut pas dépasser ${MAX_SUBJECT_LENGTH} caractères`,
      });
    }

    const userId = req.userId;
    const orderId = normalizeText(req.body.orderId);
    if (orderId) {
      const order = await OrderModel.findOne({ orderId, userId }).select("_id");
      if (!order) {
        return res.status(404).json({
          error: true,
          success: false,
          message: "Commande introuvable dans votre compte",
        });
      }
    }

    const { text, attachments, location, error } =
      await getMessageContent(req);
    if (error) {
      return res.status(400).json({
        error: true,
        success: false,
        message: error,
      });
    }

    const conversation = await SupportConversationModel.create({
      userId,
      subject,
      orderId,
      lastMessageAt: new Date(),
      messages: [
        {
          sender: "customer",
          senderId: userId,
          text,
          attachments,
          location,
          seenByCustomer: true,
          seenByAdmin: false,
        },
      ],
    });

    return res.status(201).json({
      error: false,
      success: true,
      message: "Votre message a été envoyé au service client",
      data: conversation,
    });
  } catch (error) {
    console.error("Erreur de création de conversation support:", error.message);
    return res.status(500).json({
      error: true,
      success: false,
      message: "Impossible d'envoyer votre message",
    });
  }
};

export const getCustomerConversations = async (req, res) => {
  try {
    const conversations = await SupportConversationModel.find({
      userId: req.userId,
    })
      .sort({ lastMessageAt: -1 })
      .limit(100);

    return res.status(200).json({
      error: false,
      success: true,
      data: conversations.map(withUnreadCounts),
    });
  } catch (error) {
    console.error("Erreur de lecture des conversations client:", error.message);
    return res.status(500).json({
      error: true,
      success: false,
      message: "Impossible de charger vos conversations",
    });
  }
};

export const getCustomerConversation = async (req, res) => {
  try {
    const conversation = await SupportConversationModel.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!conversation) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Conversation introuvable",
      });
    }

    let changed = false;
    for (const message of conversation.messages) {
      if (message.sender === "admin" && !message.seenByCustomer) {
        message.seenByCustomer = true;
        changed = true;
      }
    }
    if (changed) await conversation.save();

    return res.status(200).json({
      error: false,
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Erreur de lecture de conversation client:", error.message);
    return res.status(500).json({
      error: true,
      success: false,
      message: "Impossible de charger cette conversation",
    });
  }
};

export const sendCustomerConversationMessage = async (req, res) => {
  try {
    const conversation = await SupportConversationModel.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!conversation) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Conversation introuvable",
      });
    }

    const { text, attachments, location, error } =
      await getMessageContent(req);
    if (error) {
      return res.status(400).json({ error: true, success: false, message: error });
    }

    conversation.messages.push({
      sender: "customer",
      senderId: req.userId,
      text,
      attachments,
      location,
      seenByCustomer: true,
      seenByAdmin: false,
    });
    conversation.status = "open";
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.status(201).json({
      error: false,
      success: true,
      message: "Votre réponse a été envoyée",
      data: conversation,
    });
  } catch (error) {
    console.error("Erreur d'envoi de message client:", error.message);
    return res.status(500).json({
      error: true,
      success: false,
      message: "Impossible d'envoyer votre réponse",
    });
  }
};

export const getAdminConversations = async (req, res) => {
  try {
    const status = req.query.status || "all";
    if (!["all", "open", "closed"].includes(status)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Filtre de conversation invalide",
      });
    }

    const filter = status === "all" ? {} : { status };
    const conversations = await SupportConversationModel.find(filter)
      .populate("userId", "name email")
      .sort({ lastMessageAt: -1 })
      .limit(100);

    return res.status(200).json({
      error: false,
      success: true,
      data: conversations.map(withUnreadCounts),
    });
  } catch (error) {
    console.error("Erreur de lecture de la boîte support:", error.message);
    return res.status(500).json({
      error: true,
      success: false,
      message: "Impossible de charger les conversations",
    });
  }
};

export const getAdminConversation = async (req, res) => {
  try {
    const conversation = await SupportConversationModel.findById(
      req.params.id,
    ).populate("userId", "name email");
    if (!conversation) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Conversation introuvable",
      });
    }

    if (req.query.markRead !== "false") {
      let changed = false;
      for (const message of conversation.messages) {
        if (message.sender === "customer" && !message.seenByAdmin) {
          message.seenByAdmin = true;
          changed = true;
        }
      }
      if (changed) await conversation.save();
    }

    return res.status(200).json({
      error: false,
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Erreur de lecture admin conversation:", error.message);
    return res.status(500).json({
      error: true,
      success: false,
      message: "Impossible de charger cette conversation",
    });
  }
};

export const sendAdminConversationMessage = async (req, res) => {
  try {
    const conversation = await SupportConversationModel.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Conversation introuvable",
      });
    }

    const { text, attachments, location, error } =
      await getMessageContent(req);
    if (error) {
      return res.status(400).json({ error: true, success: false, message: error });
    }

    conversation.messages.push({
      sender: "admin",
      senderId: req.userId,
      text,
      attachments,
      location,
      seenByAdmin: true,
      seenByCustomer: false,
    });
    conversation.status = "open";
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.status(201).json({
      error: false,
      success: true,
      message: "Votre réponse a été envoyée",
      data: conversation,
    });
  } catch (error) {
    console.error("Erreur d'envoi de réponse support:", error.message);
    return res.status(500).json({
      error: true,
      success: false,
      message: "Impossible d'envoyer votre réponse",
    });
  }
};

export const updateSupportConversationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Statut de conversation invalide",
      });
    }

    const conversation = await SupportConversationModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true },
    ).populate("userId", "name email");

    if (!conversation) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Conversation introuvable",
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: "Statut mis à jour",
      data: conversation,
    });
  } catch (error) {
    console.error("Erreur de mise à jour du statut support:", error.message);
    return res.status(500).json({
      error: true,
      success: false,
      message: "Impossible de mettre à jour la conversation",
    });
  }
};
