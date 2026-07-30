import React, { useState, useEffect } from "react";
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";
import { FaEye, FaSearch } from "react-icons/fa";
import { editData, fetchDataFromApi } from "../utils/api";
import { orderStatusInfo, paymentStatusInfo } from "../utils/orderStatus";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import AdminOrderDetailsPanel from "./AdminOrderDetailsPanel";
import "./orderstab.scss";

const ORDER_STATUS_OPTIONS = ["Reçue", "En préparation", "Expédiée", "Livrée", "Annulée"];

const PAYMENT_STATUS_OPTIONS = ["Payée", "À payer à la livraison", "Échec"];

const formatAddress = (address) => {
  if (!address) return "—";
  const parts = [address.address_line1, address.landmark, address.city].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
};

const OrdersTabPage = () => {
  const [openOrder, setOpenOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // === Filtres ===
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // === Pagination serveur ===
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(false);

      const params = new URLSearchParams({
        order_status: orderStatusFilter,
        payment_status: paymentStatusFilter,
        search: searchTerm,
        dateFrom,
        dateTo,
        page: currentPage,
        perPage: itemsPerPage,
      });

      try {
        const res = await fetchDataFromApi(`/api/order/get-all?${params.toString()}`);

        if (res?.success) {
          setOrders(res.data || []);
          setTotalItems(res.total || 0);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [orderStatusFilter, paymentStatusFilter, searchTerm, dateFrom, dateTo, currentPage, itemsPerPage]);

  const toggleOrder = (id) => {
    setOpenOrder(openOrder === id ? null : id);
  };

  const hasActiveFilters =
    orderStatusFilter || paymentStatusFilter || searchTerm || dateFrom || dateTo;

  const resetFilters = () => {
    setOrderStatusFilter("");
    setPaymentStatusFilter("");
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const previousOrders = orders;

    // Mise à jour optimiste de l'affichage
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, order_status: newStatus } : o))
    );
    setUpdatingId(orderId);

    try {
      const res = await editData(`/api/order/update-status/${orderId}`, {
        order_status: newStatus,
      });

      if (!res?.success) {
        setOrders(previousOrders); // rollback si l'API refuse
      }
    } catch (err) {
      setOrders(previousOrders); // rollback si erreur réseau
    } finally {
      setUpdatingId(null);
    }
  };

  if (error) {
    return <div className="tab-content orders-tab"><p>Impossible de charger les commandes.</p></div>;
  }

  return (
    <div className="tab-content orders-tab">
      {/* === Barre de filtres === */}
      <div className="orders-filters">
        <div className="form-group">
          <label>Statut commande</label>
          <select
            value={orderStatusFilter}
            onChange={(e) => {
              setOrderStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tous</option>
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Statut paiement</label>
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tous</option>
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Du</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="form-group">
          <label>Au</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="search-bar">
          <FaSearch className="icon" />
          <input
            type="text"
            placeholder="Rechercher (client, n° commande...)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {hasActiveFilters && (
          <button type="button" className="reset-filters-btn" onClick={resetFilters}>
            Réinitialiser
          </button>
        )}
      </div>

      {loading ? (
        <div className="orders-loading">
          <CircularProgress />
        </div>
      ) : orders.length === 0 ? (
        <p>Aucune commande ne correspond à ces filtres.</p>
      ) : (
        <div className="orders-wrapper">
          <div className="orders-table">
            {/* === Header === */}
            <div className="table-header">
              <span></span>
              <span>Commande</span>
              <span>Client</span>
              <span>Livraison</span>
              <span>Total</span>
              <span>Paiement</span>
              <span>Date</span>
              <span>Statut</span>
              <span></span>
            </div>

            {orders.map((order) => {
              const isOpen = openOrder === order._id;
              const orderStatus = orderStatusInfo(order.order_status);
              const paymentStatus = paymentStatusInfo(order.payment_status);
              const addr = order.delivery_address;

              return (
                <div key={order._id} className="order-row">
                  <div
                    className={`order-summary ${isOpen ? "active" : ""}`}
                    onClick={() => toggleOrder(order._id)}
                  >
                    <span className={`arrow-icon ${isOpen ? "up" : "down"}`}>
                      <MdOutlineKeyboardArrowUp />
                    </span>

                    {/* Commande : ID lisible, l'ID Mongo complet reste consultable au survol */}
                    <span className="cell-order-id" title={order._id}>
                      {order.orderId}
                    </span>

                    {/* Client : le COMPTE qui a passé la commande — peut différer du destinataire */}
                    <span className="cell-client">
                      <strong>{order.userId?.name || "—"}</strong>
                      <small title={order.userId?._id}>{order.userId?.email || "—"}</small>
                    </span>

                    {/* Livraison : le DESTINATAIRE réel (snapshot figé au moment de la commande) */}
                    <span className="cell-delivery">
                      <strong>{addr?.name || "—"}</strong>
                      <small>{addr?.mobile || "—"}</small>
                      <small className="cell-address" title={formatAddress(addr)}>
                        {formatAddress(addr)}
                        {addr?.pincode ? ` (${addr.pincode})` : ""}
                      </small>
                    </span>

                    <span>{(order.totalAmt || 0).toLocaleString()} FCFA</span>

                    {/* Paiement : badge + référence transaction discrète en dessous */}
                    <span className="cell-payment">
                      <span className={`payment-status ${paymentStatus.className}`}>
                        {paymentStatus.label}
                      </span>
                      {order.paymentId && (
                        <small title={order.paymentId}>Réf: {order.paymentId}</small>
                      )}
                    </span>

                    <span>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>

                    <select
                      className={`status-select ${orderStatus.className}`}
                      value={order.order_status}
                      disabled={updatingId === order._id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      {ORDER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn-view-order"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      title="Voir le détail complet"
                    >
                      <FaEye />
                    </button>
                  </div>

                  {/* Détails toujours présents dans le DOM, visibilité pilotée par une classe simple (pas d'animation opacity) */}
                  <div className={`order-details ${isOpen ? "open" : ""}`}>
                    {isOpen && (
                      <>
                        {(!order.products || order.products.length === 0) ? (
                          <p className="no-products">Aucun produit associé à cette commande.</p>
                        ) : (
                          <div className="products-grid">
                            <div className="products-grid-header">
                              <span>ID Produit</span>
                              <span>Produit</span>
                              <span>Image</span>
                              <span>Quantité</span>
                              <span>Prix</span>
                              <span>Subtotal</span>
                            </div>
                            {order.products.map((item, idx) => (
                              <div className="products-grid-row" key={item._id || item.productId || idx}>
                                <span title={item.productId}>{item.productId}</span>
                                <span>{item.productTitle}</span>
                                <span>
                                  <img
                                    src={item.image}
                                    alt={item.productTitle}
                                    className="product-image"
                                  />
                                </span>
                                <span>{item.quantity}</span>
                                <span>{(item.price || 0).toLocaleString()} FCFA</span>
                                <span>
                                  {((item.price || 0) * (item.quantity || 0)).toLocaleString()} FCFA
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* === Pied de tableau : sélecteur d'items + pagination === */}
          <div className="table-footer">
            <div className="items-selector">
              <label>Afficher</label>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <span>éléments</span>
            </div>

            <PaginationPro
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {selectedOrder && (
        <AdminOrderDetailsPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default OrdersTabPage;