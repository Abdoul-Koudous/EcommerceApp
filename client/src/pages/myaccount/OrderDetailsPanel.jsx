import React from "react";
import { FaTimes } from "react-icons/fa";
import { orderStatusInfo, paymentStatusInfo } from "../utils/orderStatus";
import "./OrderDetailsPanel.scss";

const OrderDetailsPanel = ({ order, userEmail, onClose }) => {
  if (!order) return null;

  const addr = order.delivery_address;
  const orderStatus = orderStatusInfo(order.order_status);
  const paymentStatus = paymentStatusInfo(order.payment_status);

  const formattedDate = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="order-panel-overlay" onClick={onClose} />
      <div className="order-details-panel">
        <div className="panel-header">
          <div>
            <h3>Commande {order.orderId}</h3>
            <span className="panel-date">{formattedDate}</span>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="panel-badges">
          <span className={`status ${orderStatus.className}`}>{orderStatus.label}</span>
          <span className={`payment-status ${paymentStatus.className}`}>
            {paymentStatus.label}
          </span>
        </div>

        <div className="panel-section">
          <h4>Client</h4>
          <p><strong>{addr?.name || "—"}</strong></p>
          <p>{addr?.mobile || "—"}</p>
          <p>{userEmail || "—"}</p>
        </div>

        <div className="panel-section">
          <h4>Adresse de livraison</h4>
          {addr ? (
            <>
              <span className="address-badge">{addr.addressType || "—"}</span>
              <p>
                {addr.address_line1}
                {addr.landmark && `, ${addr.landmark}`}
              </p>
              <p>
                {addr.city}, {addr.state} {addr.country}
              </p>
              <p>Code postal : {addr.pincode}</p>
            </>
          ) : (
            <p>Adresse indisponible</p>
          )}
        </div>

        <div className="panel-section">
          <h4>Articles ({order.products.length})</h4>
          <div className="panel-products">
            {order.products.map((item, idx) => (
              <div className="panel-product-row" key={`${order._id}-${item.productId}-${idx}`}>
                <img src={item.image || "/placeholder.png"} alt={item.productTitle} />
                <div className="panel-product-info">
                  <span className="panel-product-title">{item.productTitle}</span>
                  <span className="panel-product-qty">Qté : {item.quantity}</span>
                </div>
                <span className="panel-product-price">
                  {(item.price * item.quantity).toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h4>Paiement</h4>
          <div className="panel-summary-row">
            <span>Sous-total</span>
            <span>{order.subTotalAmt?.toLocaleString()} FCFA</span>
          </div>
          <div className="panel-summary-row">
            <span>Livraison</span>
            <span>{order.shippingAmt?.toLocaleString()} FCFA</span>
          </div>
          <div className="panel-summary-row">
            <span>Taxes</span>
            <span>{order.taxAmt?.toLocaleString()} FCFA</span>
          </div>
          <div className="panel-summary-row panel-summary-total">
            <span>Total</span>
            <span>{order.totalAmt?.toLocaleString()} FCFA</span>
          </div>
          {order.paymentId && (
            <p className="panel-payment-id">ID de transaction : {order.paymentId}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderDetailsPanel;