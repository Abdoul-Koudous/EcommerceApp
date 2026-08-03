import BlogModel from '../models/blog.model.js';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto'; // ✅ ajouté

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
})

// ✅ Upload depuis le buffer en mémoire (comme les autres controllers),
// avec un public_id UNIQUE à chaque appel pour éviter que Cloudinary
// ne refuse d'écraser un asset existant et renvoie une ancienne image.
const uploadFromBuffer = (fileBuffer, originalName = "") => {
    return new Promise((resolve, reject) => {
        const baseName = originalName
            ? originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
            : "blog";
        const uniqueId = `${baseName}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

        const uploadStream = cloudinary.uploader.upload_stream(
            { public_id: uniqueId, overwrite: false },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

export async function uploadImages(request, response) {
    try {
        const image = request.files;
        const imagesArr = []; // ✅ locale à la requête, plus de variable partagée au niveau module

        for (let i = 0; i < image?.length; i++) {
            // ✅ await correct sur une vraie Promise, plus de callback perdu dans le vide
            const result = await uploadFromBuffer(image[i].buffer, image[i].originalname);
            imagesArr.push(result.secure_url);
        }

        return response.status(200).json({
            images: imagesArr
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function addBlog(req, res) {
  try {
    const blog = new BlogModel({
      title: req.body.title,
      images: req.body.images || [],
      description: req.body.description,
    });

    const saved = await blog.save();

    return res.status(200).json({
      message: "Blog créé",
      success: true,
      blog: saved,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
      error: true,
    });
  }
}

export async function getBlogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 5;

    const total = await BlogModel.countDocuments();

    const blogs = await BlogModel.find()
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      error: false,
      data: blogs,
      total: total,
      page: page,
      perPage: perPage
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
      error: true
    });
  }
}

export async function getBlog(request, response){
    try {
        const blog = await BlogModel.findById(request.params.id);

        if (!blog){
            return response.status(404).json({
                message: "Le blog avec cet ID n'existe pas",
                error: true,
                success:false
            });
        }

        return response.status(200).json({
            error: false,
            success: true,
            blog: blog
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function deleteBlog(request, response) {
    try {
        const blog = await BlogModel.findById(request.params.id);

        if (!blog) {
            return response.status(404).json({
                message: "blog introuvable",
                success: false,
                error: true
            });
        }

        const images = blog.images || [];

        for (let img of images) {
            const urlArr = img.split("/");
            const image = urlArr[urlArr.length - 1];
            const imageName = image.split(".")[0];

            if (imageName) {
                await cloudinary.uploader.destroy(imageName);
            }
        }

        await BlogModel.findByIdAndDelete(request.params.id);

        return response.status(200).json({
            success: true,
            error: false,
            message: "blog supprimée"
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}

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

export async function updatedBlog(request, response) {
    try {
        const blog = await BlogModel.findByIdAndUpdate(
            request.params.id,
            {
                title: request.body.title,
                images: request.body.images, // ✅ corrigé : vient du payload du front, plus de variable globale
                description: request.body.description,
            },
            { new: true }
        );

        if(!blog){
            return response.status(500).json({
                message: "Le Blog n'a pas ete mise a jour",
                success: false,
                error:true
            });
        }

        response.status(200).json({
            error: false,
            success: true,
            blog
        });
    } catch (error) {
        response.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}