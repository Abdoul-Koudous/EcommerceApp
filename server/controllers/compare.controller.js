// controllers/compare.controller.js
import CompareModel from "../models/compare.model.js";

const MAX_COMPARE_ITEMS = 4;

export const addToCompareController = async (request, response) => {
    try {
        const userId = request.userId;
        const {
            productId,
            productTitle,
            image,
            rating,
            price,
            oldPrice,
            brand,
            discount
        } = request.body;

        const item = await CompareModel.findOne({
            userId,
            productId
        });

        if (item) {
            return response.status(400).json({
                message: "L'element est deja dans le comparateur",
                error: true,
                success: false
            });
        }

        const count = await CompareModel.countDocuments({ userId });
        if (count >= MAX_COMPARE_ITEMS) {
            return response.status(400).json({
                message: `Vous ne pouvez comparer que ${MAX_COMPARE_ITEMS} produits maximum`,
                error: true,
                success: false
            });
        }

        const compareItem = new CompareModel({
            productId,
            productTitle,
            image,
            rating,
            price,
            oldPrice,
            brand,
            discount,
            userId
        });

        const save = await compareItem.save();

        return response.status(200).json({
            error: false,
            success: true,
            message: "Produit ajouté au comparateur",
            data: save
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const deleteFromCompareController = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId } = req.params;

        const deleted = await CompareModel.findOneAndDelete({
            userId,
            productId,
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Produit pas trouvé dans le comparateur",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Retiré du comparateur",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getCompareController = async (request, response) => {
    try {
        const userId = request.userId;
        const compareItems = await CompareModel.find({ userId });

        return response.status(200).json({
            error: false,
            success: true,
            data: compareItems
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};