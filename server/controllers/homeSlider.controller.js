import HomeSliderModel from "../models/homeSlider.model.js";


import { v2 as cloudinary} from 'cloudinary';
import { error } from 'console';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
})

var imagesArr = [];
// Upload images
export async function uploadImages(req, res) {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: true, message: "Aucune image fournie" });
  }

  const uploadedUrls = [];

  try {
    for (const file of files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "homeSlides"
        });

        uploadedUrls.push(result.secure_url);
      } finally {
        // Supprime toujours le fichier local, même en cas d'erreur Cloudinary
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    return res.status(200).json({ success: true, images: uploadedUrls });
  } catch (err) {
    // Supprime tous les fichiers restants en cas d'erreur générale
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    console.error("UploadImages error:", err);
    return res.status(500).json({ success: false, error: true, message: err.message });
  }
}

// Ajouter un slide
export async function addHomeSlide(req, res) {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0)
      return res.status(400).json({ error: true, message: "Au moins une image est requise" });

    const slide = await HomeSliderModel.create({ images });
    return res.status(200).json({ success: true, slide, message: "Slide créé avec succès" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: true, message: err.message });
  }
}

export async function getHomeSlides(request, response) {
  try {
    // Récupérer les paramètres de pagination depuis l'URL
    const page = parseInt(request.query.page) || 1;      // page actuelle
    const perPage = parseInt(request.query.perPage) || 5; // éléments par page

    // Nombre total de slides
    const total = await HomeSliderModel.countDocuments();

    // Slides pour la page actuelle
    const slides = await HomeSliderModel.find()
      .skip((page - 1) * perPage)
      .limit(perPage);

    if (!slides) {
      return response.status(404).json({
        message: "Slides non trouvés",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      data: slides,    // les slides de la page
      total,           // nombre total de slides
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

export async function getSlide(request, response){
    try {
        const slide = await HomeSliderModel.findById(request.params.id);

        if (!slide){
            return response.status(404).json({
                message: "Le slide avec cet ID n'existe pas",
                error: true,
                success:false
            });
        }

        return response.status(200).json({
            error: false,
            success: true,
            slide: slide
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function removeImageFromCloudinary(req, res) {
  try {
    const imgUrl = req.query.img;
    if (!imgUrl) {
      return res.status(400).json({ error: true, message: "Aucune image fournie" });
    }

    // Extraire le public_id complet (dossier + nom, sans extension)
    const urlParts = imgUrl.split("/"); // sépare les segments de l'URL
    const fileName = urlParts[urlParts.length - 1]; // slide1.jpg
    const folder = urlParts[urlParts.length - 2]; // homeSlides (le dossier)
    const publicId = `${folder}/${fileName.split(".")[0]}`; // homeSlides/slide1

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(500).json({ error: true, message: "Impossible de supprimer l'image" });
    }

    return res.status(200).json({ 
      error: false, 
      success: true, 
      message: "Image supprimée avec succès",
      result 
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}
export async function deleteSlide(req, res) {
  try {
    const slide = await HomeSliderModel.findById(req.params.id);

    // Vérification du slide
    if (!slide) {
      return res.status(404).json({
        message: "Slide introuvable",
        success: false,
        error: true
      });
    }

    const images = slide.images || [];

    // Supprimer les images sur Cloudinary
    for (let img of images) {
      try {
        const urlParts = img.split("/");
        const fileName = urlParts[urlParts.length - 1];   // ex: slide1.jpg
        const folder = urlParts[urlParts.length - 2];     // ex: homeSlides
        const publicId = `${folder}/${fileName.split(".")[0]}`; // ex: homeSlides/slide1

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result !== "ok" && result.result !== "not found") {
          console.warn("Impossible de supprimer l'image :", img);
        }
      } catch (err) {
        console.warn("Erreur suppression image :", img, err.message);
      }
    }

    // Supprimer le slide en base
    await HomeSliderModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Slide supprimé avec succès"
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true
    });
  }
}
// Mettre à jour un slide
export async function updatedSlide(req, res) {
  try {
    const { images } = req.body;
    const slide = await HomeSliderModel.findByIdAndUpdate(
      req.params.id,
      { images },
      { new: true }
    );

    if (!slide) return res.status(404).json({ success: false, error: true, message: "Slide introuvable" });

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
      success: false
    });
  }

  try {
    const slides = await HomeSliderModel.find({ _id: { $in: ids } });

    for (const slide of slides) {
      if (Array.isArray(slide.images)) {
        for (const imgUrl of slide.images) {
          try {
            const parts = imgUrl.split("/");
            const fileName = parts[parts.length - 1];   // ex: slide1.jpg
            const folder = parts[parts.length - 2];     // ex: homeSlides
            const publicId = `${folder}/${fileName.split(".")[0]}`; // ex: homeSlides/slide1

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
      error: false
    });

  } catch (error) {
    console.error("DELETE MULTIPLE ERROR:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: true,
      success: false
    });
  }
}