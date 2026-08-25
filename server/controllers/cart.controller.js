import cartProductModel from "../models/cartproduct.model.js";
import ProductModel from "../models/product.model.js";

// ────────────────────────────────────────────────────────────
// ✅ Helper : construit le filtre d'identité du panier — soit par
// compte (userId, priorité si connecté), soit par session invité
// (guestSessionId). Centralise cette logique pour ne pas la répéter
// dans chaque fonction.
// ────────────────────────────────────────────────────────────
function buildOwnerFilter(request) {
  if (request.userId) {
    return { userId: request.userId };
  }
  const guestSessionId = request.body?.guestSessionId || request.query?.guestSessionId;
  if (guestSessionId) {
    return { guestSessionId };
  }
  return null; // ni connecté, ni sessionId fourni : requête invalide
}

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
    const ownerFilter = buildOwnerFilter(req);

    if (!ownerFilter) {
      return res.status(400).json({
        message: "Identification du panier requise (connexion ou session)",
        success: false,
      });
    }

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
      selectedVariants,
    } = req.body;

    if (!productId || !quantity || !price) {
      return res.status(400).json({
        message: "productId, quantity et price requis",
        success: false,
      });
    }

    const qty = Number(quantity);

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

    if (qty > countInStock) {
      return res.status(400).json({
        message:
          countInStock > 0
            ? `Stock insuffisant — seulement ${countInStock} disponible(s)`
            : "Ce produit (ou cette variante) est en rupture de stock",
        success: false,
      });
    }

    const existingItems = await cartProductModel.find({ ...ownerFilter, productId });
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
      ...ownerFilter, // userId OU guestSessionId, jamais les deux
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
    const ownerFilter = buildOwnerFilter(request);

    if (!ownerFilter) {
      // Pas d'erreur bloquante ici : un visiteur tout juste arrivé, sans
      // sessionId encore généré côté front, a simplement un panier vide.
      return response.json({ data: [], error: false, success: true });
    }

    const cartItems = await cartProductModel
      .find(ownerFilter)
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
    const ownerFilter = buildOwnerFilter(req);

    if (!ownerFilter) {
      return res.status(400).json({
        message: "Identification du panier requise (connexion ou session)",
        success: false,
      });
    }

    const { _id, qty, size, color, ram, weight, selectedVariants } = req.body;

    if (!_id) {
      return res.status(400).json({
        message: "_id requis",
        success: false,
      });
    }

    const cartItem = await cartProductModel.findOne({ _id, ...ownerFilter });

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

    const nextSelectedVariants =
      selectedVariants !== undefined
        ? selectedVariants
        : cartItem.selectedVariants
          ? Object.fromEntries(cartItem.selectedVariants)
          : {};

    if (selectedVariants !== undefined) {
      const otherItems = await cartProductModel.find({
        ...ownerFilter,
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
      { _id, ...ownerFilter },
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
    const ownerFilter = buildOwnerFilter(req);

    if (!ownerFilter) {
      return res.status(400).json({
        message: "Identification du panier requise (connexion ou session)",
        success: false,
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID requis",
        success: false,
      });
    }

    const deleted = await cartProductModel.deleteOne({
      _id: id,
      ...ownerFilter,
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
    // ⚠️ Cette route utilise déjà un :id dans l'URL — on garde la
    // rétrocompatibilité en la traitant comme un userId direct, mais
    // ce n'est utilisé qu'après connexion dans la pratique (vidage
    // du panier après commande).
    const userId = req.params.id;

    await cartProductModel.deleteMany({ userId });

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

// ────────────────────────────────────────────────────────────
// ✅ NOUVEAU : fusionne le panier invité (guestSessionId) dans le
// panier du compte (userId), appelé juste après une connexion réussie.
// Les items en doublon (même produit + même variante) sont ignorés
// côté invité pour ne pas créer de conflit avec ce que l'utilisateur
// avait déjà dans son panier de compte.
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ✅ Fonction pure (pas un handler de route) : fusionne le panier
// invité (guestSessionId) dans le panier du compte (userId). Appelée
// directement depuis loginUserController/authWithGoogle pour tout
// faire en une seule requête de connexion, sans aller-retour réseau
// supplémentaire côté front.
// ────────────────────────────────────────────────────────────
export async function mergeGuestCart(userId, guestSessionId) {
  if (!userId || !guestSessionId) return;

  const guestItems = await cartProductModel.find({ guestSessionId });
  if (guestItems.length === 0) return;

  const userItems = await cartProductModel.find({ userId });

  for (const guestItem of guestItems) {
    const duplicate = userItems.find(
      (item) =>
        item.productId === guestItem.productId &&
        sameSelectedVariants(item.selectedVariants, guestItem.selectedVariants),
    );

    if (duplicate) {
      await cartProductModel.deleteOne({ _id: guestItem._id });
    } else {
      await cartProductModel.updateOne(
        { _id: guestItem._id },
        { $set: { userId }, $unset: { guestSessionId: "" } },
      );
    }
  }
}

// Route HTTP conservée (utile si on veut fusionner sans repasser par un
// login complet, ex: sur un token déjà valide) — appelle juste la
// fonction pure ci-dessus.
export const mergeGuestCartController = async (req, res) => {
  try {
    const userId = req.userId;
    const { guestSessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Connexion requise", success: false });
    }

    await mergeGuestCart(userId, guestSessionId);

    return res.status(200).json({
      message: "Panier fusionné avec succès",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};