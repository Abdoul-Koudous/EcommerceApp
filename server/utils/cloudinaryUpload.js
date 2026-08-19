import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

// ✅ Upload depuis un buffer en mémoire, avec un public_id UNIQUE à chaque appel
// (évite que Cloudinary ne refuse d'écraser un asset existant et ne renvoie
// une ancienne image au lieu de la nouvelle)
export const uploadFromBuffer = (fileBuffer, originalName = "", prefix = "image") => {
    return new Promise((resolve, reject) => {
        const baseName = originalName
            ? originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
            : prefix;
        const uniqueId = `${baseName}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                public_id: uniqueId,
                overwrite: false,
                resource_type: "auto", // ✅ laisse Cloudinary détecter image/vidéo/fichier
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

// ✅ Supprime une image Cloudinary à partir de son URL
export const removeFromCloudinary = async (imgUrl) => {
    if (!imgUrl) return null;
    const imageName = imgUrl.split("/").pop().split(".")[0];
    if (!imageName) return null;
    return cloudinary.uploader.destroy(imageName);
};

export { cloudinary };