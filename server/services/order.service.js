import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
/**
 * Récupère des commandes selon un scope et des filtres, avec pagination serveur.
 *
 * - userId fourni  → commandes d'un seul utilisateur (usage client)
 * - userId omis/null → toutes les commandes (usage admin uniquement,
 *   la restriction d'accès se fait dans le middleware adminAuth, pas ici)
 *
 * Filtres optionnels (usage admin) :
 * - order_status   : statut logistique exact ("Reçue", "Expédiée", ...)
 * - payment_status : statut de paiement exact
 * - search         : recherche libre sur le n° de commande, le destinataire
 *                    (delivery_address, snapshot embarqué) et le compte client
 *                    (nom/email, via une résolution préalable des userId correspondants)
 * - dateFrom/dateTo : plage sur createdAt (dateTo inclut toute la journée)
 *
 * delivery_address est un sous-document embarqué : pas de .populate() dessus,
 * contrairement à userId qui reste une vraie référence vers le compte ayant
 * passé la commande.
 *
 * Retourne { orders, total } pour permettre la pagination côté frontend.
 */
export const findOrders = async ({
  userId = null,
  order_status = "",
  payment_status = "",
  search = "",
  dateFrom = "",
  dateTo = "",
  page = 1,
  perPage = 10,
} = {}) => {
  const filter = {};

  if (userId) {
    filter.userId = userId;
  }

  if (order_status) {
    filter.order_status = order_status;
  }

  if (payment_status) {
    filter.payment_status = payment_status;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999); // on inclut toute la journée de fin
      filter.createdAt.$lte = end;
    }
  }

  if (search) {
    const regex = new RegExp(search, "i");

    const orConditions = [
      { orderId: regex },
      { "delivery_address.name": regex },
      { "delivery_address.mobile": regex },
    ];

    // Le compte client (userId) est une référence externe : on résout d'abord
    // les comptes correspondants au nom/email, puis on les ajoute au $or.
    const matchingUsers = await UserModel.find(
      { $or: [{ name: regex }, { email: regex }] },
      "_id"
    );

    if (matchingUsers.length > 0) {
      orConditions.push({ userId: { $in: matchingUsers.map((u) => u._id) } });
    }

    filter.$or = orConditions;
  }

  const currentPage = Math.max(1, Number(page) || 1);
  const limit = Math.max(1, Number(perPage) || 10);
  const skip = (currentPage - 1) * limit;

  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email mobile"),
    OrderModel.countDocuments(filter),
  ]);

  return { orders, total };
};