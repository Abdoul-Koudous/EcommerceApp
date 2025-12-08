import MyListModel from "../models/myList.model.js";
import mongoose from "mongoose";

export const addToMyListController = async (request, response)=>{
    try {
        const userId = request.userId
        const {
            productId,
            productTitle,
            image,
            rating,
            price,
            oldPrice,
            brand,
            discount}= request.body;
        const item = await MyListModel.findOne({
            userId: userId,
            productId: productId
        })

        if(item){
            return response.status(400).json({
                message: "L'element est deja dans la list"
            })
        }
        const myList = new MyListModel({
            productId,
            productTitle,
            image,
            rating,
            price,
            oldPrice,
            brand,
            discount,
            userId

        })

        const save = await myList.save();

        return response.status(200).json({
            error:false,
            success: true,
            message: "Le produit est enregistrer dans ma list "
        })
        
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error: true,
            success: false
        })
        
    }
}


export const deleteToMyListController = async (request, response) => {
    try {
        const itemId = request.params.id;

        // 🛑 Vérification ID avant tout
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "ID invalide : format ObjectId incorrect"
            });
        }

        const myListItem = await MyListModel.findById(itemId);

        if (!myListItem) {
            return response.status(404).json({
                error: true,
                success: false,
                message: "L'élément avec ces informations est introuvable"
            });
        }

        const deletedItem = await MyListModel.findByIdAndDelete(itemId);

        if (!deletedItem) {
            return response.status(404).json({
                error: true,
                success: false,
                message: "L'élément n'a pas été supprimé"
            });
        }

        return response.status(200).json({
            error: false,
            success: true,
            message: "L'élément a été supprimé de mes souhaits"
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


export const getMyListController = async (request, response) => {
    try {
        const userId = request.userId;
        const myListItem = await MyListModel.find({
            userId:userId
        })

        return response.status(200).json({
            error: false,
            success:true,
            data:myListItem
        })
    } catch (error) {
         return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
        
    }
}