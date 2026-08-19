import ContactMessageModel from "../models/contactMessage.model.js";
import { uploadFromBuffer } from "../utils/cloudinaryUpload.js";
import { sendReplyEmail } from "../utils/mailer.js";

// POST /api/contact-message/send — public, formulaire du site
export const sendMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Nom, email et message sont obligatoires",
      });
    }

    const newMessage = new ContactMessageModel({ name, email, subject, message });
    await newMessage.save();

    res.status(201).json({
      success: true,
      error: false,
      message: "Message envoyé avec succès",
      data: newMessage,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: true, message: err.message });
  }
};

// GET /api/contact-message — admin, avec pagination + filtre lu/non-lu
export const getAllMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const filter = {};

    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === "true";
    }

    const total = await ContactMessageModel.countDocuments(filter);

    const messages = await ContactMessageModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.json({
      success: true,
      error: false,
      data: messages,
      total,
      page,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: true, message: err.message });
  }
};

// GET /api/contact-message/:id — admin, détail d'un message
export const getMessageById = async (req, res) => {
  try {
    const message = await ContactMessageModel.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, error: true, message: "Message introuvable" });
    }

    res.json({ success: true, error: false, data: message });
  } catch (err) {
    res.status(500).json({ success: false, error: true, message: err.message });
  }
};

// PATCH /api/contact-message/:id/read — admin, marquer comme lu/non-lu
// PUT /api/contact-message/:id/read — admin, marquer comme lu/non-lu
export const markAsRead = async (req, res) => {
  try {
    const { isRead = true } = req.body;

    const message = await ContactMessageModel.findByIdAndUpdate(
      req.params.id,
      { isRead },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, error: true, message: "Message introuvable" });
    }

    res.json({ success: true, error: false, message: "Statut mis à jour", data: message });
  } catch (err) {
    res.status(500).json({ success: false, error: true, message: err.message });
  }
};

// DELETE /api/contact-message/:id — admin
export const deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessageModel.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, error: true, message: "Message introuvable" });
    }

    res.json({ success: true, error: false, message: "Message supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, error: true, message: err.message });
  }
};



// POST /api/contact-message/:id/reply — admin, répondre avec texte + pièces jointes
export const sendReply = async (req, res) => {
  try {
    const message = await ContactMessageModel.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, error: true, message: "Message introuvable" });
    }

    const { text } = req.body;
    const files = req.files || [];

    if (!text?.trim() && files.length === 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Ajoutez un texte ou une pièce jointe",
      });
    }

    // ✅ Upload des pièces jointes (images/vidéos) sur Cloudinary
    const attachments = [];
    for (const file of files) {
      const result = await uploadFromBuffer(file.buffer, file.originalname, "reply");
      attachments.push(result.secure_url);
    }

    // ✅ Envoi réel de l'email au client
    await sendReplyEmail({
      to: message.email,
      subject: message.subject,
      text: text || "",
      attachments,
    });

    // ✅ Sauvegarde dans l'historique de conversation
    message.replies.push({ text: text || "", attachments });
    message.isRead = true;
    await message.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: "Réponse envoyée avec succès",
      data: message,
    });
  } catch (error) {
    console.error("Erreur envoi réponse:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Erreur lors de l'envoi de la réponse",
    });
  }
};