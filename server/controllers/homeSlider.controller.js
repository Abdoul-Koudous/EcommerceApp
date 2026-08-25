import HomeSliderModel from "../models/homeSlider.model.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

const uploadFromBuffer = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const BADGE_COLORS = ["primary", "accent", "success", "danger"];

// Construit l'objet de champs éditoriaux à partir du body, en ne
// retenant que ce qui est défini (utile pour addHomeSlide/updatedSlide).
function buildEditorialFields(body) {
  const fields = {};

  if (body.title !== undefined) fields.title = body.title?.trim();
  if (body.subtitle !== undefined) fields.subtitle = body.subtitle?.trim() || "";
  if (body.badgeText !== undefined) fields.badgeText = body.badgeText?.trim() || "";

  if (body.badgeColor !== undefined) {
    fields.badgeColor = BADGE_COLORS.includes(body.badgeColor)
      ? body.badgeColor
      : "accent";
  }

  if (body.highlights !== undefined) {
    const highlights = Array.isArray(body.highlights)
      ? body.highlights.map((h) => String(h).trim()).filter(Boolean)
      : [];
    fields.highlights = highlights.slice(0, 3);
  }

  if (body.ctaText !== undefined) {
    fields.ctaText = body.ctaText?.trim() || "Découvrir";
  }

  if (body.ctaLink !== undefined) fields.ctaLink = body.ctaLink?.trim() || "";
  if (body.isActive !== undefined) fields.isActive = Boolean(body.isActive);
  if (body.startDate !== undefined) fields.startDate = body.startDate || null;
  if (body.endDate !== undefined) fields.endDate = body.endDate || null;
  if (body.order !== undefined) fields.order = Number(body.order) || 0;

  return fields;
}

// Upload images
export async function uploadImages(req, res) {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: true, message: "Aucune image fournie" });
  }

  const uploadedUrls = [];

  try {
    for (const file of files) {
      const result = await uploadFromBuffer(file.buffer, { folder: "homeSlides" });
      uploadedUrls.push(result.secure_url);
    }

    return res.status(200).json({ success: true, images: uploadedUrls });
  } catch (err) {
    console.error("UploadImages error:", err);
    return res.status(500).json({ success: false, error: true, message: err.message });
  }
}

// Ajouter un slide
export async function addHomeSlide(req, res) {
  try {
    const { images, title } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: true, message: "Au moins une image est requise" });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: true, message: "Le titre est requis" });
    }

    const slide = await HomeSliderModel.create({
      images,
      ...buildEditorialFields(req.body),
    });

    return res.status(200).json({ success: true, slide, message: "Slide créé avec succès" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: true, message: err.message });
  }
}

/**
 * Liste complète pour l'admin — tous les slides, actifs ou non,
 * dans la fenêtre de dates ou non.
 */
export async function getHomeSlides(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 5;

    const total = await HomeSliderModel.countDocuments();

    const slides = await HomeSliderModel.find()
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      data: slides,
      total,
      page,
      perPage,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

/**
 * Liste publique — utilisée par le HomeSlider côté client.
 * Ne renvoie que les slides actifs et dans leur fenêtre de diffusion
 * (startDate/endDate), triés par ordre manuel.
 */
export async function getActiveHomeSlides(request, response) {
  try {
    const now = new Date();

    const filter = {
      isActive: true,
      $and: [
        {
          $or: [{ startDate: null }, { startDate: { $lte: now } }],
        },
        {
          $or: [{ endDate: null }, { endDate: { $gte: now } }],
        },
      ],
    };

    const slides = await HomeSliderModel.find(filter).sort({ order: 1, createdAt: -1 });

    return response.status(200).json({
      error: false,
      success: true,
      data: slides,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getSlide(request, response) {
  try {
    const slide = await HomeSliderModel.findById(request.params.id);

    if (!slide) {
      return response.status(404).json({
        message: "Le slide avec cet ID n'existe pas",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      slide: slide,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function removeImageFromCloudinary(req, res) {
  try {
    const imgUrl = req.query.img;
    if (!imgUrl) {
      return res.status(400).json({ error: true, message: "Aucune image fournie" });
    }

    const urlParts = imgUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${fileName.split(".")[0]}`;

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(500).json({ error: true, message: "Impossible de supprimer l'image" });
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: "Image supprimée avec succès",
      result,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}

export async function deleteSlide(req, res) {
  try {
    const slide = await HomeSliderModel.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({
        message: "Slide introuvable",
        success: false,
        error: true,
      });
    }

    const images = slide.images || [];

    for (let img of images) {
      try {
        const urlParts = img.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileName.split(".")[0]}`;

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result !== "ok" && result.result !== "not found") {
          console.warn("Impossible de supprimer l'image :", img);
        }
      } catch (err) {
        console.warn("Erreur suppression image :", img, err.message);
      }
    }

    await HomeSliderModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Slide supprimé avec succès",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

// Mettre à jour un slide
export async function updatedSlide(req, res) {
  try {
    const updateData = {};

    if (req.body.images !== undefined) {
      updateData.images = req.body.images;
    }

    Object.assign(updateData, buildEditorialFields(req.body));

    const slide = await HomeSliderModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!slide) {
      return res.status(404).json({ success: false, error: true, message: "Slide introuvable" });
    }

    return res.status(200).json({ success: true, slide, message: "Slide mis à jour" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: true, message: err.message });
  }
}

export async function deleteMultipleSlides(req, res) {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      message: "Aucun ID de slide fourni",
      error: true,
      success: false,
    });
  }

  try {
    const slides = await HomeSliderModel.find({ _id: { $in: ids } });

    for (const slide of slides) {
      if (Array.isArray(slide.images)) {
        for (const imgUrl of slide.images) {
          try {
            const parts = imgUrl.split("/");
            const fileName = parts[parts.length - 1];
            const folder = parts[parts.length - 2];
            const publicId = `${folder}/${fileName.split(".")[0]}`;

            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.warn("Image non supprimée :", imgUrl);
          }
        }
      }
    }

    await HomeSliderModel.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      message: "Slides supprimés avec succès",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("DELETE MULTIPLE ERROR:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: true,
      success: false,
    });
  }
}