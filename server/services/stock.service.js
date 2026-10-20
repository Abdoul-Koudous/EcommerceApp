import ProductModel from "../models/product.model.js";

const stockError = (message) => {
  const error = new Error(message);
  error.status = 409;
  return error;
};

const getSelectedVariants = (raw) => {
  const selected =
    raw instanceof Map ? Object.fromEntries(raw) : raw || {};
  return Object.fromEntries(
    Object.entries(selected).sort(([first], [second]) =>
      first.localeCompare(second),
    ),
  );
};

const groupStockItems = (products) => {
  const grouped = new Map();

  for (const item of products) {
    const productId = String(item.productId || "");
    const quantity = Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw stockError("Un produit de la commande a une quantité invalide");
    }

    const selectedVariants = getSelectedVariants(item.selectedVariants);
    const key = `${productId}:${JSON.stringify(selectedVariants)}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      grouped.set(key, { productId, quantity, selectedVariants });
    }
  }

  return [...grouped.values()];
};

const getStockFilter = (
  item,
  direction,
  usesVariantStock,
  enforceAvailability = direction < 0,
) => {
  const filter = { _id: item.productId };
  if (enforceAvailability) {
    filter.countIntStock = { $gte: item.quantity };
  }

  if (usesVariantStock) {
    filter.hasVariants = true;
    filter.useVariantStock = true;
    if (Object.keys(item.selectedVariants).length === 0) {
      throw stockError(
        "Une variante doit être sélectionnée pour réserver le stock",
      );
    }

    const unsafeKey = Object.keys(item.selectedVariants).find(
      (key) => !key || key.startsWith("$") || key.includes("."),
    );
    if (unsafeKey) {
      throw stockError("Une variante de ce produit ne peut pas être vérifiée");
    }

    const combination = Object.fromEntries(
      Object.entries(item.selectedVariants).map(([key, value]) => [
        `combination.${key}`,
        value,
      ]),
    );
    filter.variantCombinations = {
      $elemMatch: {
        ...combination,
        ...(enforceAvailability
          ? { isActive: true, stock: { $gte: item.quantity } }
          : {}),
      },
    };
  } else {
    filter.$or = [
      { hasVariants: { $ne: true } },
      { useVariantStock: { $ne: true } },
    ];
  }

  return filter;
};

const applyStockMovement = async (products, direction) => {
  const items = groupStockItems(products);
  const applied = [];

  try {
    for (const item of items) {
      const product = await ProductModel.findById(item.productId).select(
        "hasVariants useVariantStock",
      );
      if (!product) {
        throw stockError("Un produit de la commande n'existe plus");
      }

      const usesVariantStock =
        product.hasVariants === true && product.useVariantStock === true;
      const filter = getStockFilter(item, direction, usesVariantStock);
      const update = {
        $inc: {
          countIntStock: direction * item.quantity,
          ...(usesVariantStock
            ? { "variantCombinations.$.stock": direction * item.quantity }
            : {}),
        },
      };
      const updated = await ProductModel.findOneAndUpdate(filter, update, {
        new: true,
      });

      if (!updated) {
        throw stockError(
          direction < 0
            ? "Stock insuffisant ou variante indisponible. Vérifiez votre panier avant de réessayer."
            : "Impossible de restituer le stock de cette commande",
        );
      }

      applied.push({ ...item, usesVariantStock });
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const item of applied.reverse()) {
      try {
        const rolledBack = await ProductModel.findOneAndUpdate(
          getStockFilter(item, 0, item.usesVariantStock, false),
          {
            $inc: {
              countIntStock: -direction * item.quantity,
              ...(item.usesVariantStock
                ? {
                    "variantCombinations.$.stock":
                      -direction * item.quantity,
                  }
                : {}),
            },
          },
          { new: true },
        );
        if (!rolledBack) {
          throw stockError("Impossible de restituer le stock après erreur");
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }

    if (rollbackErrors.length > 0) {
      console.error("Échec du retour arrière d'une mise à jour de stock:", {
        cause: error.message,
        rollbackErrors: rollbackErrors.map(
          (rollbackError) => rollbackError.message,
        ),
      });
      throw new AggregateError(
        [error, ...rollbackErrors],
        "La mise à jour du stock a échoué et son retour arrière est incomplet",
      );
    }

    throw error;
  }
};

export async function decrementStock(products) {
  return applyStockMovement(products, -1);
}

export async function restoreStock(products) {
  return applyStockMovement(products, 1);
}
