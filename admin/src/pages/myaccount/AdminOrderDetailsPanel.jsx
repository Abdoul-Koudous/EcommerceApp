import React from "react";
import { FaTimes } from "react-icons/fa";
import { orderStatusInfo, paymentStatusInfo } from "../utils/orderStatus";
import "./AdminOrderDetailsPanel.scss";

const formatAddress = (addr) => {
  if (!addr) return null;
  return (
    <>
      <p>
        {addr.address_line1}
        {addr.landmark && `, ${addr.landmark}`}
      </p>
      <p>
        {addr.city}
        {addr.state ? `, ${addr.state}` : ""} {addr.country}
      </p>
      <p>Code postal : {addr.pincode || "—"}</p>
    </>
  );
};

const AdminOrderDetailsPanel = ({ order, onClose }) => {
  if (!order) return null;

  const addr = order.delivery_address;
  const orderStatus = orderStatusInfo(order.order_status);
  const paymentStatus = paymentStatusInfo(order.payment_status);

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <>
      <div className="admin-order-panel-overlay" onClick={onClose} />
      <div className="admin-order-details-panel">
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

        {/* Compte qui a passé la commande — peut différer du destinataire */}
        <div className="panel-section">
          <h4>Client (compte)</h4>
          <p><strong>{order.userId?.name || "—"}</strong></p>
          <p>{order.userId?.email || "—"}</p>
          <p className={!order.userId?.mobile ? "field-missing" : ""}>
            {order.userId?.mobile || "Téléphone non renseigné"}
          </p>
        </div>

        {/* Destinataire réel — snapshot figé au moment de la commande */}
        <div className="panel-section">
          <h4>Destinataire de la livraison</h4>
          {addr ? (
            <>
              {addr.addressType && (
                <span className="address-badge">{addr.addressType}</span>
              )}
              <p><strong>{addr.name || "—"}</strong></p>
              <p>{addr.mobile || "—"}</p>
              {formatAddress(addr)}
            </>
          ) : (
            <p>Adresse indisponible</p>
          )}
        </div>

        <div className="panel-section">
          <h4>Articles ({order.products?.length || 0})</h4>
          <div className="panel-products">
            {(order.products || []).map((item, idx) => (
              <div className="panel-product-row" key={`${order._id}-${item.productId}-${idx}`}>
                <img src={item.image || "/placeholder.png"} alt={item.productTitle} />
                <div className="panel-product-info">
                  <span className="panel-product-title">{item.productTitle}</span>
                  <span className="panel-product-qty">Qté : {item.quantity}</span>
                </div>
                <span className="panel-product-price">
                  {((item.price || 0) * (item.quantity || 0)).toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h4>Paiement</h4>
          <div className="panel-summary-row">
            <span>Sous-total</span>
            <span>{(order.subTotalAmt || 0).toLocaleString()} FCFA</span>
          </div>
          <div className="panel-summary-row">
            <span>Livraison</span>
            <span>{(order.shippingAmt || 0).toLocaleString()} FCFA</span>
          </div>
          <div className="panel-summary-row">
            <span>Taxes</span>
            <span>{(order.taxAmt || 0).toLocaleString()} FCFA</span>
          </div>
          <div className="panel-summary-row panel-summary-total">
            <span>Total</span>
            <span>{(order.totalAmt || 0).toLocaleString()} FCFA</span>
          </div>
          {order.paymentId && (
            <p className="panel-payment-id">ID de transaction : {order.paymentId}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminOrderDetailsPanel;