// server/services/socialContentGenerator.service.js
import { generateCompletion } from "./llmProvider.service.js";

const OBJECTIVE_LABELS = {
  new: "Nouveau produit — création d'engouement pour une nouveauté",
  promo: "Promotion — mise en avant d'une offre ou réduction",
  low_stock: "Stock limité — créer un sentiment d'urgence, réaliste et honnête",
  premium: "Produit premium — valoriser la qualité et l'exclusivité",
};

// ────────────────────────────────────────────────────────────
// Construit un prompt riche à partir des vraies données produit, pour
// éviter tout texte générique — chaque détail concret (couleur, stock,
// matière) doit pouvoir être ancré dans le texte généré.
// ────────────────────────────────────────────────────────────
function buildProductContext(product, matchedCombination) {
  const parts = [`Nom: ${product.name}`];

  if (product.description) {
    parts.push(`Description: ${product.description}`);
  }

  const price =
    matchedCombination?.price ?? product.price;
  parts.push(`Prix: ${price} FCFA`);

  if (product.oldPrice > 0 && product.oldPrice > price) {
    const discount = Math.round(((product.oldPrice - price) / product.oldPrice) * 100);
    parts.push(`Ancien prix: ${product.oldPrice} FCFA (réduction de ${discount}%)`);
  }

  if (product.brand) {
    parts.push(`Marque: ${product.brand}`);
  }

  if (product.catName) {
    parts.push(`Catégorie: ${product.catName}`);
  }

  const stock = matchedCombination?.stock ?? product.countIntStock;
  parts.push(`Stock disponible: ${stock}`);

  if (product.hasVariants && product.variants?.length > 0) {
    const variantsDesc = product.variants
      .map((v) => `${v.name}: ${v.values.join(", ")}`)
      .join(" | ");
    parts.push(`Variantes disponibles: ${variantsDesc}`);
  }

  return parts.join("\n");
}

const SYSTEM_PROMPT = `Tu es un rédacteur commercial spécialisé en réseaux sociaux pour des commerçants en Afrique de l'Ouest (Bénin). Tu écris en français naturel, chaleureux, pas corporate.

Règles strictes :
- N'utilise JAMAIS de formules vagues comme "incroyable", "exceptionnel", "à ne pas manquer" sans les justifier avec un détail concret du produit (couleur, matière, prix, stock réel).
- Utilise TOUJOURS au moins un détail concret du produit fourni (couleur, taille, matière, prix exact, ou stock réel) — n'invente jamais de détail absent des données fournies.
- N'invente jamais de caractéristique, de promotion ou de quantité de stock qui n'est pas dans les données fournies.
- Réponds UNIQUEMENT en JSON strict, sans texte avant ou après, sans balises markdown, au format exact :
{"whatsapp": "...", "instagram": "...", "facebook": "...", "tiktok": "..."}

Contraintes de format par canal :
- whatsapp: 2-3 lignes maximum, direct, prix visible, pas de hashtags
- instagram: accroche + description + 3-5 hashtags pertinents en fin de texte
- facebook: description un peu plus détaillée que WhatsApp, prix et disponibilité visibles, pas d'excès de hashtags
- tiktok: accroche courte et punchy adaptée à une vidéo, 2-4 hashtags`;

export async function generateSocialContent(product, objective, matchedCombination = null) {
  const objectiveLabel = OBJECTIVE_LABELS[objective] || OBJECTIVE_LABELS.new;
  const productContext = buildProductContext(product, matchedCombination);

  const prompt = `Objectif de cette publication : ${objectiveLabel}

Données du produit :
${productContext}

Génère les 4 versions du post pour WhatsApp, Instagram, Facebook et TikTok, en respectant strictement le format JSON demandé.`;

  // ✅ MODIFIÉ : jsonMode activé — force une réponse JSON pure, sans texte
  // explicatif autour (corrige les échecs de parsing observés avec
  // openai/gpt-oss-120b qui ajoutait parfois du texte avant/après le JSON).
  const rawResponse = await generateCompletion(prompt, SYSTEM_PROMPT, true);

  // Sécurité supplémentaire : même en mode JSON, on nettoie d'éventuels
  // artefacts (balises markdown résiduelles) avant de parser.
  const cleaned = rawResponse.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // ✅ NOUVEAU : dernier recours — certains modèles entourent parfois le
    // JSON de texte même en mode JSON natif. On extrait le premier bloc
    // { ... } trouvé dans la réponse avant d'abandonner définitivement.
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error(
          `Le contenu généré n'est pas un JSON valide. Réponse brute: ${rawResponse.slice(0, 200)}`,
        );
      }
    } else {
      throw new Error(
        `Le contenu généré n'est pas un JSON valide. Réponse brute: ${rawResponse.slice(0, 200)}`,
      );
    }
  }

  return {
    whatsapp: parsed.whatsapp || "",
    instagram: parsed.instagram || "",
    facebook: parsed.facebook || "",
    tiktok: parsed.tiktok || "",
  };
}