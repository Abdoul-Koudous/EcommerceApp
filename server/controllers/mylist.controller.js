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
            message: "Le produit est enregistrer dans ma list ",
            data: save 
        })
        
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error: true,
            success: false
        })
        
    }
}


export const deleteToMyListController = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const deleted = await MyListModel.findOneAndDelete({
      userId,
      productId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Produit pas trouvé dans la liste",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supprimé des favoris",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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