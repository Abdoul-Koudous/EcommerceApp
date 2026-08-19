import AboutPageModel from "../models/aboutPage.model.js";
import { uploadFromBuffer, removeFromCloudinary } from "../utils/cloudinaryUpload.js";

// GET /api/about — lecture publique (client)
export const getAboutPage = async (req, res) => {
  try {
    const data = await AboutPageModel.getSingleton();
    res.json({ success: true, error: false, data });
  } catch (err) {
    res.status(500).json({ success: false, error: true, message: err.message });
  }
};

// PUT /api/about — mise à jour (admin, protégée)
export const updateAboutPage = async (req, res) => {
  try {
    const doc = await AboutPageModel.getSingleton();
    Object.assign(doc, req.body);
    await doc.save();
    res.json({ success: true, error: false, message: "Page mise à jour", data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: true, message: err.message });
  }
};

// POST /api/about/uploadImages — admin, upload hero/story image
export const uploadAboutImages = async (req, res) => {
  try {
    const files = req.files;
    const imagesArr = [];

    for (let i = 0; i < files?.length; i++) {
      const result = await uploadFromBuffer(files[i].buffer, files[i].originalname, "about");
      imagesArr.push(result.secure_url);
    }

    return res.status(200).json({
      success: true,
      error: false,
      images: imagesArr,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// DELETE /api/about/removeImage — admin
export const removeAboutImage = async (req, res) => {
  try {
    const imgUrl = req.query.img;
    if (!imgUrl) {
      return res.status(400).json({ error: true, success: false, message: "Aucune image fournie" });
    }

    const result = await removeFromCloudinary(imgUrl);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Image supprimée avec succès",
      result,
    });
  } catch (error) {
    return res.status(500).json({ error: true, success: false, message: error.message });
  }
};