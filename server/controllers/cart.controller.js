import cartProductModel from "../models/cartproduct.model.js";
import ProductModel from "../models/product.model.js";

// ────────────────────────────────────────────────────────────
// ✅ Helper partagé : retrouve la combinaison de variantes exacte
// choisie par le client parmi celles définies sur le produit, et
// renvoie le stock/prix/sku effectifs à utiliser.
//
// Retourne null si le produit n'utilise pas le stock par combinaison
// ou si aucune variante n'a été sélectionnée (comportement identique
// à avant pour les produits simples). Retourne undefined si une
// sélection a été fournie mais ne correspond à aucune combinaison connue.
// ────────────────────────────────────────────────────────────
function resolveVariantCombination(product, selectedVariants) {
  if (
    !product.hasVariants ||
    !product.useVariantStock ||
    !selectedVariants ||
    Object.keys(selectedVariants).length === 0
  ) {
    return null;
  }

  const matched = product.variantCombinations.find((combo) => {
    const comboObj = Object.fromEntries(combo.combination);
    return (
      Object.keys(selectedVariants).length === Object.keys(comboObj).length &&
      Object.entries(selectedVariants).every(
        ([key, val]) => comboObj[key] === val,
      )
    );
  });

  return matched || undefined;
}

// ────────────────────────────────────────────────────────────
// ✅ Helper : compare deux objets de variantes sélectionnées pour
// savoir s'il s'agit de la MÊME combinaison (utilisé pour détecter
// les doublons dans le panier, variante par variante — pas juste
// par productId).
// ────────────────────────────────────────────────────────────
function sameSelectedVariants(a, b) {
  const objA = a instanceof Map ? Object.fromEntries(a) : a || {};
  const objB = b instanceof Map ? Object.fromEntries(b) : b || {};

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => objA[key] === objB[key]);
}

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
      quantity,
      discount,
      size,
      weight,
      ram,
      brand,
      selectedVariants, // ✅ ex: { "Couleur": "Rouge", "Taille": "M" }
    } = req.body;

    if (!productId || !quantity || !price) {
      return res.status(400).json({
        message: "productId, quantity et price requis",
        success: false,
      });
    }

    const qty = Number(quantity);

    // ✅ On récupère le produit réel pour vérifier le stock à la source,
    // jamais faire confiance au stock envoyé par le front.
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable",
        success: false,
      });
    }

    let countInStock = product.countIntStock;
    let effectivePrice = price;
    let selectedCombinationSku = "";

    const matchedCombination = resolveVariantCombination(
      product,
      selectedVariants,
    );

    if (matchedCombination === undefined) {
      return res.status(400).json({
        message: "Cette combinaison de variantes n'existe pas pour ce produit",
        success: false,
      });
    }

    if (matchedCombination) {
      if (!matchedCombination.isActive) {
        return res.status(400).json({
          message: "Cette combinaison n'est plus disponible",
          success: false,
        });
      }

      countInStock = matchedCombination.stock;
      selectedCombinationSku = matchedCombination.sku || "";

      if (
        matchedCombination.price !== null &&
        matchedCombination.price !== undefined
      ) {
        effectivePrice = matchedCombination.price;
      }
    }

    // ✅ Vérification du stock AVANT ajout au panier
    if (qty > countInStock) {
      return res.status(400).json({
        message:
          countInStock > 0
            ? `Stock insuffisant — seulement ${countInStock} disponible(s)`
            : "Ce produit (ou cette variante) est en rupture de stock",
        success: false,
      });
    }

    // ✅ CORRIGÉ : on ne bloque plus sur productId seul — un même produit
    // avec DEUX variantes différentes (ex: Rouge et Noir) doit pouvoir
    // coexister comme deux lignes distinctes dans le panier. On ne bloque
    // que si c'est vraiment LA MÊME combinaison déjà présente.
    const existingItems = await cartProductModel.find({ userId, productId });
    const exists = existingItems.find((item) =>
      sameSelectedVariants(item.selectedVariants, selectedVariants),
    );

    if (exists) {
      return res.status(400).json({
        message: "Cette variante de ce produit est déjà dans le panier",
        success: false,
      });
    }

    const newItem = new cartProductModel({
      productTitle,
      image,
      price: effectivePrice,
      quantity: qty,
      subTotal: qty * effectivePrice,
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

      selectedVariants: selectedVariants || {},
      selectedCombinationSku,

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
    const { _id, qty, size, color, ram, weight, selectedVariants } = req.body;

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

    // ✅ Si le client change de variante, on utilise la NOUVELLE sélection
    // envoyée ; sinon on retombe sur celle déjà enregistrée sur l'item.
    const nextSelectedVariants =
      selectedVariants !== undefined
        ? selectedVariants
        : cartItem.selectedVariants
          ? Object.fromEntries(cartItem.selectedVariants)
          : {};

    // ✅ Si la variante change, il faut vérifier qu'on ne crée pas un
    // doublon avec une AUTRE ligne déjà présente dans le panier pour
    // cette même combinaison.
    if (selectedVariants !== undefined) {
      const otherItems = await cartProductModel.find({
        userId,
        productId: cartItem.productId,
        _id: { $ne: _id },
      });
      const duplicate = otherItems.find((item) =>
        sameSelectedVariants(item.selectedVariants, nextSelectedVariants),
      );
      if (duplicate) {
        return res.status(400).json({
          message: "Cette variante est déjà présente dans une autre ligne du panier",
          success: false,
        });
      }
    }

    const matchedCombination = resolveVariantCombination(
      product,
      nextSelectedVariants,
    );

    if (matchedCombination === undefined) {
      return res.status(400).json({
        message: "Cette combinaison de variantes n'existe pas pour ce produit",
        success: false,
      });
    }

    if (matchedCombination && !matchedCombination.isActive) {
      return res.status(400).json({
        message: "Cette combinaison n'est plus disponible",
        success: false,
      });
    }

    let maxStock = product.countIntStock;
    let effectivePrice = product.price;
    let selectedCombinationSku = cartItem.selectedCombinationSku || "";

    if (matchedCombination) {
      maxStock = matchedCombination.stock;
      selectedCombinationSku = matchedCombination.sku || "";
      if (
        matchedCombination.price !== null &&
        matchedCombination.price !== undefined
      ) {
        effectivePrice = matchedCombination.price;
      }
    }

    if (maxStock <= 0) {
      return res.status(400).json({
        message: "Cette variante est en rupture de stock",
        success: false,
      });
    }

    const newQty = Math.min(Math.max(1, Number(qty || cartItem.quantity)), maxStock);

    const updated = await cartProductModel.findOneAndUpdate(
      { _id, userId },
      {
        quantity: newQty,
        subTotal: newQty * effectivePrice,
        price: effectivePrice,
        countInStock: maxStock,

        size,
        color,
        ram,
        weight,

        selectedVariants: nextSelectedVariants,
        selectedCombinationSku,
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

export const emptyCartController = async (req, res) => {
  try {
    const userId = req.params.id;

    await cartProductModel.deleteMany({ userId: userId });

    res.status(200).json({
      message: "Panier vidé avec succès",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};