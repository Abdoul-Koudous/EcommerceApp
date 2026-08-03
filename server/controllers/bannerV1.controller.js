import BannerV1Model from "../models/bannerV1.model.js";
import { v2 as cloudinary } from "cloudinary";
import CategoryModel from "../models/category.model.js";

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

let imagesArr = [];

// ✅ Upload depuis le buffer en mémoire (multer memoryStorage), plus d'écriture disque
const uploadFromBuffer = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { use_filename: true, unique_filename: false, overwrite: false },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

// 🔹 UPLOAD IMAGES
export async function uploadImages(req, res) {
    try {
        imagesArr = [];

        const files = req.files;

        for (let i = 0; i < files?.length; i++) {
            const result = await uploadFromBuffer(files[i].buffer);
            imagesArr.push(result.secure_url);
        }

        return res.status(200).json({
            success: true,
            images: imagesArr,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

// ... tout le reste du fichier (addBanner, getBanners, deleteBanner, updatedBanner, etc.)
// reste identique, aucun changement nécessaire.

// 🔹 CREATE BANNER
export async function addBanner(req, res) {
    try {
        const category = await CategoryModel.findById(req.body.catId);
         if (!category) {
        return res.status(400).json({
            success: false,
            message: "Catégorie introuvable",
        });
        }
        const banner = new BannerV1Model({
            bannerTitle: req.body.bannerTitle,
            images: req.body.images, // ✅ IMPORTANT
            catId: req.body.catId,
            subCatId: req.body.subCatId,
            thirdsubCatId: req.body.thirdsubCatId,
            price: req.body.price,
            alignInfo: req.body.alignInfo,
            categoryName: req.body.categoryName || category.name
        });

        const savedBanner = await banner.save();

        return res.status(200).json({
            success: true,
            error: false,
            message: "Bannière créée avec succès",
            banner: savedBanner,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}


// 🔹 GET ALL BANNERS
export async function getBanners(req, res) {
    try {
        const banners = await BannerV1Model.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            error: false,
            data: banners,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}


// 🔹 GET SINGLE BANNER
export async function getBanner(req, res) {
    try {
        const banner = await BannerV1Model.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                message: "Bannière introuvable",
                error: true,
                success: false,
            });
        }

        return res.status(200).json({
            success: true,
            error: false,
            banner,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}


// 🔹 DELETE IMAGE CLOUDINARY
export async function removeImageFromCloudinary(req, res) {
    try {
        const imgUrl = req.query.img;

        if (!imgUrl) {
            return res.status(400).json({
                error: true,
                message: "Aucune image fournie",
            });
        }

        const imageName = imgUrl.split("/").pop().split(".")[0];

        const result = await cloudinary.uploader.destroy(imageName);

        return res.status(200).json({
            success: true,
            error: false,
            message: "Image supprimée",
            result,
        });

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message,
        });
    }
}


// 🔹 DELETE BANNER
export async function deleteBanner(req, res) {
    try {
        const banner = await BannerV1Model.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                message: "Bannière introuvable",
                success: false,
                error: true,
            });
        }

        // 🔥 supprimer images cloudinary
        for (let img of banner.images) {
            const imageName = img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imageName);
        }

        await BannerV1Model.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            error: false,
            message: "Bannière supprimée",
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
            error: true,
        });
    }
}


// 🔹 UPDATE BANNER
export async function updatedBanner(req, res) {
    try {
        const banner = await BannerV1Model.findByIdAndUpdate(
            req.params.id,
            {
                bannerTitle: req.body.bannerTitle,
                images: req.body.images, // ✅ important
                catId: req.body.catId,
                subCatId: req.body.subCatId,
                thirdsubCatId: req.body.thirdsubCatId,
                price: req.body.price,
            },
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({
                message: "Bannière non trouvée",
                success: false,
                error: true,
            });
        }

        return res.status(200).json({
            success: true,
            error: false,
            banner,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
            error: true,
        });
    }
}