import cartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";

export const addToCartItemController = async(request, response)=>{
    try {
        const userId = request.userId
        const {productId} = request.body

        if(!productId){
            return response.status(402).json({
                message: "Fournissez l'identifiaant du produit",
                error: true,
                success: false
            });
        }

        const checkItemCart = await cartProductModel.findOne({
            userId: userId,
            productId: productId
        })

        if(checkItemCart){
            return response.status(400).json({
                message : "L'item est deja dans le panier"
            })
        }

        const cartItem = new cartProductModel({
            quantity: 1,
            userId: userId,
            productId: productId
        })

        const save = await cartItem.save()

        const upd = await UserModel.updateOne({_id : userId},{
            $push : {
                shopping_cart :  productId
            }

        })

        return response.status(200).json({
            data:save,
            message: "Item ajouter avec succes",
            error: false,
            success: true
        })
        
    } catch (error) {
        return response.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
        
    }
}

export const getCartItemController = async (request,response) => {
    try {
        const userId = request.userId;

        const cartItem = await cartProductModel.find({
            userId: userId
        }).populate('productId')
        return response.json({
            data: cartItem,
            error: false,
            success: true
        })
        
    } catch (error) {
        return response.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
        
    }
}

export const updateCartItemController = async (request,response) => {
    try {
        const userId = request.userId
        const { _id,qty} = request.body

        if(!_id || !qty){
            return response.status(400).json({
                message: "Fourniser le _id et le qty"
            })
        }

        const updateCartitem = await cartProductModel.updateOne({
            _id: _id,
            userId: userId
        },

        {
            quantity: qty
        }
    )

    return response.json({
        message: "Le panier a ete mise a jour ",
        success: true,
        error: true,
        data: updateCartitem
    })
        
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
        
    }
}

export const deleteCartItemQtyController = async (request,response) => {
    try {
        const userId = request.userId
        const { _id,productId} = request.body

        if(!_id){
            return response.status(400).json({
                message: "Fourniser le _id ",
                error: true,
                success: false

            })
        }

        const deleteCartItem = await cartProductModel.deleteOne({
            _id: _id,
            userId: userId
        })

        if(!deleteCartItem){
            return response.status(400).json({
                message: "Le produit dans le panier est introuvable",
                success: false
            })
        }

        const user= await UserModel.findOne({
            _id:userId
        })
        const cartItem = user?.shopping_cart;

        const updatedUserCart = [...cartItem.slice(0, cartItem.indexOf(productId)),
             ...cartItem.slice(cartItem.indexOf(productId) + 1)];
        user.shopping_cart = updatedUserCart;
        await user.save();



        return response.json({
            message: "L'item suprimer",
            error: false,
            success: true,
            data: deleteCartItem

        })
        
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
        
        
    }
}