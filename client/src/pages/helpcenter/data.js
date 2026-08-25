// 📁 Fichier à créer : client/src/pages/helpcenter/data.js

import { fetchDataFromApi } from "../utils/api";

/**
 * Catégories (questions publiées uniquement), avec icône + description
 * — voir getCategories côté backend pour la logique de regroupement.
 */
export async function getFaqCategories() {
  const res = await fetchDataFromApi("/api/help-faq/getCategories");
  if (!res?.success) return [];
  return res.categories || []; // [{ key, title, icon, description }]
}

/**
 * Toutes les questions publiées, triées par catégorie/ordre côté backend.
 * Pas de filtre côté requête : le composant filtre localement (catégorie +
 * recherche) sur la liste complète, pour garder l'autocomplétion instantanée.
 */
export async function getFaqs() {
  const res = await fetchDataFromApi("/api/help-faq/getAll");
  if (!res?.success) return [];
  return res.data || [];
}