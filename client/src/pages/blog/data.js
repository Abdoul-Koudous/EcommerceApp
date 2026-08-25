// Service de données du blog — branché sur l'API réelle.
// Remplace l'ancien mock statique. Toutes les fonctions sont async.

import { fetchDataFromApi } from "../utils/api";

/**
 * Article "à la une" (featured) — utilisé par le hero de la page liste.
 */
export async function getFeaturedArticle() {
  const res = await fetchDataFromApi("/api/blog/getFeatured");
  if (!res?.success) return null;
  return res.blog || null;
}

/**
 * Catégories disponibles (articles publiés uniquement, côté backend).
 * Ne contient PAS "Tous" — c'est à l'appelant de le préfixer si besoin.
 */
export async function getCategories() {
  const res = await fetchDataFromApi("/api/blog/getCategories");
  if (!res?.success) return [];
  return res.categories || [];
}

/**
 * Liste d'articles publiés, avec filtre catégorie optionnel.
 * excludeFeatured=true (par défaut) exclut l'article à la une, comme
 * le faisait le mock (`.filter(a => !a.featured)`).
 */
/**
 * Liste d'articles publiés, avec filtre catégorie optionnel + pagination.
 * excludeFeatured=true (par défaut) exclut l'article à la une, comme
 * le faisait le mock (`.filter(a => !a.featured)`).
 *
 * Retourne { articles, page, totalPages, total } pour piloter une
 * pagination Précédent/Suivant côté UI.
 */
export async function getArticles({
  category,
  excludeFeatured = true,
  page = 1,
  perPage = 6,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));

  if (category && category !== "Tous") {
    params.set("category", category);
  }

  if (excludeFeatured) {
    params.set("excludeFeatured", "true");
  }

  const res = await fetchDataFromApi(`/api/blog/getAll?${params.toString()}`);

  if (!res?.success) {
    return { articles: [], page: 1, totalPages: 1, total: 0 };
  }

  return {
    articles: res.data || [],
    page: res.page || 1,
    totalPages: res.totalPages || 1,
    total: res.total || 0,
  };
}

/**
 * Un article par id (page détail). Retourne null si introuvable
 * ou si c'est un brouillon (le backend le filtre déjà).
 */
export async function getArticleById(id) {
  const res = await fetchDataFromApi(`/api/blog/getOne/${id}`);
  if (!res?.success) return null;
  return res.blog || null;
}

/**
 * Articles liés : d'abord ceux de la même catégorie, puis on complète
 * avec d'autres articles publiés si besoin — même logique que l'ancien
 * mock, mais recalculée via l'API (pas d'endpoint dédié côté backend).
 * Pas de pagination ici : on prend une fenêtre large pour avoir de quoi choisir.
 */
export async function getRelatedArticles(article, limit = 3) {
  if (!article) return [];

  const { articles: sameCategory } = await getArticles({
    category: article.category,
    excludeFeatured: false,
    perPage: 20,
  });

  let related = sameCategory.filter((a) => a._id !== article._id);

  if (related.length < limit) {
    const { articles: others } = await getArticles({
      excludeFeatured: false,
      perPage: 20,
    });
    const fill = others.filter(
      (a) => a._id !== article._id && !related.some((r) => r._id === a._id)
    );
    related = related.concat(fill);
  }

  return related.slice(0, limit);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}