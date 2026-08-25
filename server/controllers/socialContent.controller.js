// server/controllers/socialContent.controller.js
import ProductModel from "../models/product.model.js";
import SocialContentModel from "../models/socialContent.model.js";
import { generateSocialContent } from "../services/socialContentGenerator.service.js";

// ────────────────────────────────────────────────────────────
// Génère (ou régénère explicitement) le contenu social pour un produit
// + un objectif donné. Ne génère JAMAIS automatiquement — uniquement à
// la demande du vendeur (bouton "Générer" / "Régénérer" côté admin).
// ────────────────────────────────────────────────────────────
export async function generateContentForProduct(request, response) {
  try {
    const { productId, objective, variantCombination } = request.body;

    if (!productId || !objective) {
      return response.status(400).json({
        message: "productId et objective sont requis",
        error: true,
        success: false,
      });
    }

    const product = await ProductModel.findById(productId);

    if (!product) {
      return response.status(404).json({
        message: "Produit introuvable",
        error: true,
        success: false,
      });
    }

    // Si le vendeur a précisé une combinaison de variante particulière
    // (ex: générer un post pour "Rouge" spécifiquement), on la retrouve.
    let matchedCombination = null;
    if (variantCombination && product.hasVariants) {
      matchedCombination = product.variantCombinations.find((combo) => {
        const comboObj = Object.fromEntries(combo.combination);
        return (
          Object.keys(variantCombination).length === Object.keys(comboObj).length &&
          Object.entries(variantCombination).every(
            ([key, val]) => comboObj[key] === val,
          )
        );
      });
    }

    const generated = await generateSocialContent(product, objective, matchedCombination);

    // Upsert : remplace le contenu existant pour ce produit+objectif s'il
    // y en avait déjà un (régénération), sinon en crée un nouveau.
    const socialContent = await SocialContentModel.findOneAndUpdate(
      { productId, objective },
      {
        ...generated,
        generatedFromPrice: matchedCombination?.price ?? product.price,
        generatedFromStock: matchedCombination?.stock ?? product.countIntStock,
      },
      { new: true, upsert: true },
    );

    return response.status(200).json({
      message: "Contenu généré avec succès",
      error: false,
      success: true,
      socialContent,
    });
    } catch (error) {
    console.error("❌ ERREUR GÉNÉRATION CONTENU:", error); // ✅ debug temporaire
    return response.status(500).json({
      message: error.message || "Erreur lors de la génération du contenu",
      error: true,
      success: false,
    });
  }
}

// ────────────────────────────────────────────────────────────
// Récupère le contenu déjà généré pour un produit (tous objectifs
// confondus), sans rien régénérer — utilisé pour l'affichage.
// ────────────────────────────────────────────────────────────
export async function getContentForProduct(request, response) {
  try {
    const { productId } = request.params;

    const contents = await SocialContentModel.find({ productId }).sort({
      updatedAt: -1,
    });

    return response.status(200).json({
      error: false,
      success: true,
      contents,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

// ────────────────────────────────────────────────────────────
// Permet au vendeur de modifier manuellement un texte généré avant de
// l'utiliser (jamais de publication automatique sans relecture — cf.
// notre principe validé plus tôt : le vendeur reste maître du texte final).
// ────────────────────────────────────────────────────────────
export async function updateContentField(request, response) {
  try {
    const { id } = request.params;
    const { channel, text } = request.body;

    const validChannels = ["whatsapp", "instagram", "facebook", "tiktok"];
    if (!validChannels.includes(channel)) {
      return response.status(400).json({
        message: "Canal invalide",
        error: true,
        success: false,
      });
    }

    const updated = await SocialContentModel.findByIdAndUpdate(
      id,
      { [channel]: text },
      { new: true },
    );

    if (!updated) {
      return response.status(404).json({
        message: "Contenu introuvable",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      message: "Contenu mis à jour",
      error: false,
      success: true,
      socialContent: updated,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}