import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import CategoryModel from "../models/category.model.js";

/**
 * Fenêtres glissantes de 7 jours (plutôt que semaine calendaire lundi-dimanche)
 * pour éviter les comparaisons faussées en milieu de semaine.
 * Le mensuel (calendaire) sera géré séparément dans la partie Rapports.
 */
const getWeekRanges = () => {
  const now = new Date();

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 7);

  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 14);

  return { now, thisWeekStart, lastWeekStart };
};

/**
 * Calcule le % d'évolution entre deux périodes.
 * Cas particuliers : si la période précédente est à 0, on évite la division
 * par zéro (100% si on est passé de 0 à quelque chose, 0% si les deux sont à 0).
 */
const computeTrend = (current, previous) => {
  if (previous === 0) {
    if (current === 0) return { trend: "up", percent: "+0.0%" };
    return { trend: "up", percent: "+100.0%" };
  }

  const diff = ((current - previous) / previous) * 100;
  const trend = diff >= 0 ? "up" : "down";
  const sign = diff >= 0 ? "+" : "";

  return { trend, percent: `${sign}${diff.toFixed(1)}%` };
};

/**
 * Statistiques du dashboard admin : total à date + tendance semaine vs
 * semaine précédente, pour Utilisateurs, Commandes, Revenus, Produits et
 * Catégories.
 *
 * ⚠️ Revenus : on ne compte que les commandes avec payment_status "Payée"
 * (argent réellement encaissé), pas les commandes "À payer à la livraison"
 * qui n'ont pas encore généré de revenu réel. À ajuster si ce n'est pas
 * la définition de "revenu" que tu veux.
 */
export const getDashboardStats = async () => {
  const { now, thisWeekStart, lastWeekStart } = getWeekRanges();

  const [
    totalUsers,
    usersThisWeek,
    usersLastWeek,
    totalOrders,
    ordersThisWeek,
    ordersLastWeek,
    totalProducts,
    productsThisWeek,
    productsLastWeek,
    totalCategories,
    categoriesThisWeek,
    categoriesLastWeek,
    revenueAgg,
    revenueThisWeekAgg,
    revenueLastWeekAgg,
  ] = await Promise.all([
    UserModel.countDocuments({}),
    UserModel.countDocuments({ createdAt: { $gte: thisWeekStart, $lte: now } }),
    UserModel.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } }),

    OrderModel.countDocuments({}),
    OrderModel.countDocuments({ createdAt: { $gte: thisWeekStart, $lte: now } }),
    OrderModel.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } }),

    ProductModel.countDocuments({}),
    ProductModel.countDocuments({ createdAt: { $gte: thisWeekStart, $lte: now } }),
    ProductModel.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } }),

    CategoryModel.countDocuments({}),
    CategoryModel.countDocuments({ createdAt: { $gte: thisWeekStart, $lte: now } }),
    CategoryModel.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } }),

    OrderModel.aggregate([
      { $match: { payment_status: "Payée" } },
      { $group: { _id: null, total: { $sum: "$totalAmt" } } },
    ]),
    OrderModel.aggregate([
      {
        $match: {
          payment_status: "Payée",
          createdAt: { $gte: thisWeekStart, $lte: now },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmt" } } },
    ]),
    OrderModel.aggregate([
      {
        $match: {
          payment_status: "Payée",
          createdAt: { $gte: lastWeekStart, $lt: thisWeekStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmt" } } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const revenueThisWeek = revenueThisWeekAgg[0]?.total || 0;
  const revenueLastWeek = revenueLastWeekAgg[0]?.total || 0;

  return {
    users: { value: totalUsers, ...computeTrend(usersThisWeek, usersLastWeek) },
    orders: { value: totalOrders, ...computeTrend(ordersThisWeek, ordersLastWeek) },
    revenue: { value: totalRevenue, ...computeTrend(revenueThisWeek, revenueLastWeek) },
    products: { value: totalProducts, ...computeTrend(productsThisWeek, productsLastWeek) },
    categories: {
      value: totalCategories,
      ...computeTrend(categoriesThisWeek, categoriesLastWeek),
    },
  };
};

/**
 * Statistiques mensuelles pour le graphique Clients / Ventes de l'année en
 * cours. "Clients" = nouveaux comptes créés ce mois. "Ventes" = nombre de
 * commandes passées ce mois (en unités, peu importe leur statut de paiement).
 * Pour suivre le revenu plutôt que le volume, remplace $sum: 1 par
 * $sum: "$totalAmt" dans le pipeline OrderModel ci-dessous.
 */
const MONTH_LABELS = [
  "Janv", "Févr", "Mars", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
];

export const getMonthlyStats = async () => {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear + 1, 0, 1);

  const [usersByMonth, salesByMonth] = await Promise.all([
    UserModel.aggregate([
      { $match: { createdAt: { $gte: yearStart, $lt: yearEnd } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      {
        $match: {
          payment_status: "Payée",
          createdAt: { $gte: yearStart, $lt: yearEnd },
        },
      },
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$totalAmt" } } },
    ]),
  ]);

  const usersMap = Object.fromEntries(usersByMonth.map((m) => [m._id, m.count]));
  const salesMap = Object.fromEntries(salesByMonth.map((m) => [m._id, m.total]));

  return MONTH_LABELS.map((label, idx) => ({
    name: label,
    clients: usersMap[idx + 1] || 0,
    ventes: salesMap[idx + 1] || 0,
  }));
};