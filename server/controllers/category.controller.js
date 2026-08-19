import CategoryModel from '../models/category.model.js';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto'; // ✅ ajouté

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
})

// ✅ Upload depuis le buffer en mémoire, avec un public_id UNIQUE à chaque appel
// (évite que Cloudinary ne refuse d'écraser un asset existant et ne renvoie
// une ancienne image au lieu de la nouvelle)
const uploadFromBuffer = (fileBuffer, originalName = "") => {
    return new Promise((resolve, reject) => {
        const baseName = originalName
            ? originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
            : "category";
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

export async function createCategory(request, response) {
    try {
        let category = new CategoryModel({
            name: request.body.name,
            images: request.body.images || [], // ✅ vient du payload envoyé par le front, plus de variable globale
            parentId: request.body.parentId,
            parentCatName: request.body.parentCatName,

            // ✅ NOUVEAU : taux de taxe par défaut de la catégorie
            taxRate: request.body.taxRate,
        });

        if(!category){
            return response.status(500).json({
                message: "La Categorie n'est pas ete creer",
                error: true,
                success: false
            });
        }

        category = await category.save();

        return response.status(200).json({
            message: "La Categorie est creer",
            error: false,
            success: true,
            category: category
        });
        
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
        
    }
    
}

export async function getCategories(request, response) {
    try {
        const categories = await CategoryModel.find();
        const categoryMap = {};

        categories.forEach(cat => {
            categoryMap[cat._id] = { ...cat._doc, children: [] };
        });

        const rootCategories = [];

        categories.forEach(cat => {
            if (cat.parentId) {
                categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
            } else {
                rootCategories.push(categoryMap[cat._id]);
            }
        });

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10;
        const total = rootCategories.length;

        const startIndex = (page - 1) * perPage;
        const paginatedCategories = rootCategories.slice(startIndex, startIndex + perPage);

        return response.status(200).json({
            error: false,
            success: true,
            data: paginatedCategories,
            total
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function getCategoriesCount(request, response){
    try {
        const  categoryCount = await CategoryModel.countDocuments({parentId: undefined});
        if(!categoryCount){
            response.status(500).json({
                success: false,
                error: true
            });
        }else{
            response.send({
                categoryCount: categoryCount,
            });
        }
        
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function getSubCategoriesCount(request, response){
    try {
        const  categories = await CategoryModel.find();
        if(!categories){
            response.status(500).json({
                success: false,
                error: true
            });
        }else{
            const subCatList = [];
            for (let cat of categories){
                if (cat.parentId !== null){
                    subCatList.push(cat);
                }
            }

            response.send({
                subCategoryCount: subCatList.length,
            });
        }
        
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function getCategory(request, response){
    try {
        const category = await CategoryModel.findById(request.params.id);

        if (!category){
            return response.status(404).json({
                message: "La catégorie avec cet ID n'existe pas",
                error: true,
                success:false
            });
        }

        return response.status(200).json({
            error: false,
            success: true,
            category: category
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function removeImageFromCloudinary(request, response) {
    try {
        const imgUrl = request.query.img;
        if (!imgUrl) {
            return response.status(400).json({ error: true, message: "Aucune image fournie" });
        }

        const imageName = imgUrl.split("/").pop().split(".")[0];
        if (!imageName) {
            return response.status(400).json({ error: true, message: "Nom d'image invalide" });
        }

        const result = await cloudinary.uploader.destroy(imageName);

        return response.status(200).json({ 
            error:false, 
            success: true, 
            message: "Image supprimée avec succès",
            result 
        });

    } catch (error) {
        return response.status(500).json({ error: true, message: error.message });
    }
}

export async function deleteCategory(request, response) {
    try {
        const category = await CategoryModel.findById(request.params.id);

        if (!category) {
            return response.status(404).json({
                message: "Catégorie introuvable",
                success: false,
                error: true
            });
        }

        const images = category.images || [];

        for (let img of images) {
            const urlArr = img.split("/");
            const image = urlArr[urlArr.length - 1];
            const imageName = image.split(".")[0];

            if (imageName) {
                await cloudinary.uploader.destroy(imageName);
            }
        }

        const subCategory = await CategoryModel.find({ parentId: request.params.id });

        for (let sub of subCategory) {
            const thirdsubCategory = await CategoryModel.find({ parentId: sub._id });

            for (let third of thirdsubCategory) {
                await CategoryModel.findByIdAndDelete(third._id);
            }

            await CategoryModel.findByIdAndDelete(sub._id);
        }

        await CategoryModel.findByIdAndDelete(request.params.id);

        return response.status(200).json({
            success: true,
            error: false,
            message: "Catégorie supprimée"
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}

export async function updatedCategory(request, response) {
    try {
        const { name, parentId } = request.body;

        let parentCatName = null;
        if(parentId){
            const parentCategory = await CategoryModel.findById(parentId);
            parentCatName = parentCategory ? parentCategory.name : null;
        }

        const category = await CategoryModel.findByIdAndUpdate(
            request.params.id,
            {
                name,
                parentId: parentId || null,
                parentCatName,
                images: request.body.images, // ✅ corrigé : vient du payload du front, plus de variable globale

                // ✅ NOUVEAU : taux de taxe par défaut de la catégorie
                taxRate: request.body.taxRate,
            },
            { new: true }
        );

        if(!category){
            return response.status(500).json({
                message: "La categorie n'a pas ete mise a jour",
                success: false,
                error:true
            });
        }

        response.status(200).json({
            error: false,
            success: true,
            category
        });
    } catch (error) {
        response.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}