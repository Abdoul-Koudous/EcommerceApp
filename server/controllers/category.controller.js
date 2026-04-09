import CategoryModel from '../models/category.model.js';

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


export async function createCategory(request, response) {
    try {
        let category = new CategoryModel({
            name: request.body.name,
            images: imagesArr,
            parentId: request.body.parentId,
            parentCatName: request.body.parentCatName,
        });

        if(!category){
            return response.status(500).json({
                message: "La Categorie n'est pas ete creer",
                error: true,
                success: false
            });
        }

        category = await category.save();

        imagesArr = [];

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

        categories.forEach(cat =>{
            categoryMap[cat._id] = {...cat._doc, children: []};
        });

        const rootCategories = [];

        categories.forEach(cat => {
            if(cat.parentId){
                categoryMap[cat.parentId].children.push(categoryMap[cat._id]);

            }else{
                rootCategories.push(categoryMap[cat._id]);
            }
            
        });

        return response.status(200).json({
            error: false,
            success: true,
            data:rootCategories
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

        // 🔥 Vérification obligatoire !
        if (!category) {
            return response.status(404).json({
                message: "Catégorie introuvable",
                success: false,
                error: true
            });
        }

        const images = category.images || [];

        // 🖼️ Supprimer les images Cloudinary
        for (let img of images) {
            const urlArr = img.split("/");
            const image = urlArr[urlArr.length - 1];
            const imageName = image.split(".")[0];

            if (imageName) {
                await cloudinary.uploader.destroy(imageName);
            }
        }

        // 🔽 Sub Categories
        const subCategory = await CategoryModel.find({ parentId: request.params.id });

        for (let sub of subCategory) {
            const thirdsubCategory = await CategoryModel.find({ parentId: sub._id });

            for (let third of thirdsubCategory) {
                await CategoryModel.findByIdAndDelete(third._id);
            }

            await CategoryModel.findByIdAndDelete(sub._id);
        }

        // 🔥 Delete main category
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

        // Si parentId existe, récupérer son nom
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
                images: imagesArr.length > 0 ? imagesArr : undefined
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

        imagesArr = [];
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
