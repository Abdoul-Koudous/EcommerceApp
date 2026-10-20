import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBan, FaEye, FaReceipt } from "react-icons/fa";
import { UserContext } from "../../UserContext/UserContext";
import { fetchDataFromApi, postDataFromApi } from "../utils/api";
import { orderStatusInfo, paymentStatusInfo } from "../utils/orderStatus";
import OrderDetailsPanel from "./OrderDetailsPanel";
import { ToastContext } from "../../context/ToastContext";
import "./orderstab.scss";

const OrdersTabPage = () => {
  const { user } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const cancelOrder = async (order) => {
    if (
      !window.confirm(
        `Voulez-vous vraiment annuler la commande ${order.orderId} ? Cette action rétablira les articles en stock.`,
      )
    ) {
      return;
    }

    setCancellingOrderId(order.orderId);
    try {
      const response = await postDataFromApi(
        `/api/order/cancel/${encodeURIComponent(order.orderId)}`,
        {},
      );
      if (!response?.success) {
        openToast("error", response?.message || "Impossible d'annuler la commande");
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.orderId === order.orderId
            ? response.data
            : currentOrder,
        ),
      );
      setSelectedOrder((currentOrder) =>
        currentOrder?.orderId === order.orderId ? response.data : currentOrder,
      );
      openToast("success", response.message);
    } catch {
      openToast("error", "Erreur réseau lors de l'annulation de la commande");
    } finally {
      setCancellingOrderId(null);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    setLoading(true);
    fetchDataFromApi("/api/order/get").then((res) => {
      if (!res?.error) {
        setOrders(res.data || []);
      }
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="orders-tab">
        <p>Chargement de vos commandes...</p>
      </div>
    );
  }

  return (
    <div className="orders-tab">
      {orders.length > 0 && (
        <p className="orders-count">
          Vous avez <span className="orders-count-number">{orders.length}</span> commande
          {orders.length > 1 ? "s" : ""}
        </p>
      )}

      {orders.length === 0 ? (
        <p>Vous n'avez pas encore passé de commande.</p>
      ) : (
        <div className="orders-wrapper">
          <div className="orders-table">
            <div className="table-header">
              <span>ID Commande</span>
              <span>Total</span>
              <span>Date</span>
              <span>Statut</span>
              <span>Paiement</span>
              <span></span>
            </div>

            {orders.map((order) => {
              const orderStatus = orderStatusInfo(order.order_status);
              const paymentStatus = paymentStatusInfo(order.payment_status);

              return (
                <div key={order._id} className="order-row">
                  <span>{order.orderId}</span>
                  <span>{order.totalAmt?.toLocaleString()} FCFA</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className={`status ${orderStatus.className}`}>
                    {orderStatus.label}
                  </span>
                  <span className={`payment-status ${paymentStatus.className}`}>
                    {paymentStatus.label}
                  </span>

                  <span className="order-actions">
                    {order.order_status === "Reçue" &&
                      ["À payer à la livraison", "Échec"].includes(
                        order.payment_status,
                      ) && (
                        <button
                          className="btn-cancel-order"
                          onClick={() => cancelOrder(order)}
                          title="Annuler la commande"
                          aria-label={`Annuler la commande ${order.orderId}`}
                          disabled={cancellingOrderId === order.orderId}
                        >
                          <FaBan />
                        </button>
                      )}
                    <button
                      className="btn-view-order"
                      onClick={() => setSelectedOrder(order)}
                      title="Voir le détail"
                    >
                      <FaEye />
                    </button>
                    <Link
                      to={`/account/orders/${order.orderId}`}
                      className="btn-view-receipt"
                      title="Voir le reçu"
                    >
                      <FaReceipt />
                    </Link>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsPanel
          order={selectedOrder}
          userName={user?.name}
          userEmail={user?.email}
          userMobile={user?.mobile}
          onCancelOrder={cancelOrder}
          cancelling={cancellingOrderId === selectedOrder.orderId}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default OrdersTabPage;