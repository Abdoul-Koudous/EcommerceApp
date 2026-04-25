import cartProductModel from "../models/cartproduct.model.js";
import ProductModel from "../models/product.model.js";

export const addToCartItemController = async (req, res) => {
  try {
    const userId = req.userId;

    const {
      productTitle,
      image,
      rating,
      price,
      oldPrice,
      productId,
      countInStock,
      quantity,
      discount,
      size,
      weight,
      ram,
      brand,
    } = req.body;

    if (!productId || !quantity || !price) {
      return res.status(400).json({
        message: "productId, quantity et price requis",
        success: false,
      });
    }

    const qty = Number(quantity);

    const exists = await cartProductModel.findOne({ userId, productId });

    if (exists) {
      return res.status(400).json({
        message: "Produit déjà dans le panier",
        success: false,
      });
    }

    const newItem = new cartProductModel({
      productTitle,
      image,
      price,
      quantity: qty,
      subTotal: qty * price,
      productId,
      countInStock,
      userId,
      oldPrice,
      discount,
      rating,
      size,
      weight,
      ram,
      brand,

      // ❗ options disponibles
      sizeOptions: req.body.sizeOptions || [],
      colorOptions: req.body.colorOptions || [],
      ramOptions: req.body.ramOptions || [],
      weightOptions: req.body.weightOptions || [],
    });

    const save = await newItem.save();

    return res.json({
      message: "Produit ajouté",
      success: true,
      data: save,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCartItemController = async (request, response) => {
  try {
    const userId = request.userId;

    const cartItems = await cartProductModel
      .find({
        userId: userId,
      })
      .populate("productId");
    return response.json({
      data: cartItems,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
};

export const updateCartItemController = async (req, res) => {
  try {
    const userId = req.userId;
    const { _id, qty, size, color, ram, weight } = req.body;

    if (!_id) {
      return res.status(400).json({
        message: "_id requis",
        success: false,
      });
    }

    const cartItem = await cartProductModel.findOne({ _id, userId });

    if (!cartItem) {
      return res.status(404).json({
        message: "Item introuvable",
        success: false,
      });
    }

    const product = await ProductModel.findById(cartItem.productId);

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable",
        success: false,
      });
    }

    const newQty = Math.min(
      Math.max(1, Number(qty || cartItem.quantity)),
      product.countIntStock,
    );

    const updated = await cartProductModel.findOneAndUpdate(
      { _id, userId },
      {
        quantity: newQty,
        subTotal: newQty * product.price,

        size,
        color,
        ram,
        weight,
      },
      { new: true },
    );

    return res.json({
      message: "Panier mis à jour",
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
export const deleteCartItemQtyController = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID requis",
        success: false,
      });
    }

    const deleted = await cartProductModel.deleteOne({
      _id: id,
      userId,
    });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({
        message: "Produit introuvable dans le panier",
        success: false,
      });
    }

    return res.json({
      message: "Produit supprimé du panier",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
