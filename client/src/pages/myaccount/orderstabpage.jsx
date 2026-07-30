import React, { useContext, useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { UserContext } from "../../UserContext/UserContext";
import { fetchDataFromApi } from "../utils/api";
import { orderStatusInfo, paymentStatusInfo } from "../utils/orderStatus";
import OrderDetailsPanel from "./OrderDetailsPanel";
import "./orderstab.scss";

const OrdersTabPage = () => {
  const { user } = useContext(UserContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      <div className="tab-content orders-tab">
        <p>Chargement de vos commandes...</p>
      </div>
    );
  }

  return (
    <div className="tab-content orders-tab">
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
                  <button
                    className="btn-view-order"
                    onClick={() => setSelectedOrder(order)}
                    title="Voir le détail"
                  >
                    <FaEye />
                  </button>
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
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default OrdersTabPage;