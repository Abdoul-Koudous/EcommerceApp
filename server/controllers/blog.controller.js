import BlogModel from '../models/blog.model.js';

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
export async function uploadImages(request, response) {
    try {
        imagesArr = [];

       
        const image = request.files;

        // --- UPLOAD DES NOUVEAUX AVATARS ---
        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < image?.length; i++) {
            await cloudinary.uploader.upload(
                image[i].path,
                options,
                function (error, result) {
                    imagesArr.push(result.secure_url);
                    fs.unlinkSync(`telechargements/${request.files[i].filename}`);
                }
            );
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

    imagesArr = [];

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
      data: blogs,   // ✅ IMPORTANT (comme tes autres pages)
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

        // 🔥 Vérification obligatoire !
        if (!blog) {
            return response.status(404).json({
                message: "blog introuvable",
                success: false,
                error: true
            });
        }

        const images = blog.images || [];

        // 🖼️ Supprimer les images Cloudinary
        for (let img of images) {
            const urlArr = img.split("/");
            const image = urlArr[urlArr.length - 1];
            const imageName = image.split(".")[0];

            if (imageName) {
                await cloudinary.uploader.destroy(imageName);
            }
        }

      

        // 🔥 Delete main category
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
        const { name, parentId } = request.body;

       

        const blog = await BlogModel.findByIdAndUpdate(
            request.params.id,
            {
                title: request.body.title,
                images: imagesArr.length > 0 ? imagesArr : undefined,
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

        imagesArr = [];
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
