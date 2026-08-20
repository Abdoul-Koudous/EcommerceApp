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

// ✅ NOUVEAU
const formatSelectedVariants = (selectedVariants) => {
  if (!selectedVariants) return "";
  const obj =
    selectedVariants instanceof Map
      ? Object.fromEntries(selectedVariants)
      : selectedVariants;
  return Object.entries(obj)
    .map(([key, val]) => `${key}: ${val}`)
    .join(" · ");
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
      <div className="aop-overlay" onClick={onClose} />
      <div className="aop-panel">
        <div className="aop-header">
          <div>
            <h3>Commande {order.orderId}</h3>
            <span className="aop-date">{formattedDate}</span>
          </div>
          <button className="aop-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="aop-badges">
          <span className={`aop-order-status ${orderStatus.className}`}>{orderStatus.label}</span>
          <span className={`aop-payment-status ${paymentStatus.className}`}>
            {paymentStatus.label}
          </span>
        </div>

        {/* Compte qui a passé la commande — peut différer du destinataire */}
        <div className="aop-section">
          <h4>Client (compte)</h4>
          <p><strong>{order.userId?.name || "—"}</strong></p>
          <p>{order.userId?.email || "—"}</p>
          <p className={!order.userId?.mobile ? "aop-field-missing" : ""}>
            {order.userId?.mobile || "Téléphone non renseigné"}
          </p>
        </div>

        {/* Destinataire réel — snapshot figé au moment de la commande */}
        <div className="aop-section">
          <h4>Destinataire de la livraison</h4>
          {addr ? (
            <>
              {addr.addressType && (
                <span className="aop-address-badge">{addr.addressType}</span>
              )}
              <p><strong>{addr.name || "—"}</strong></p>
              <p>{addr.mobile || "—"}</p>
              {formatAddress(addr)}
            </>
          ) : (
            <p>Adresse indisponible</p>
          )}
        </div>

        <div className="aop-section">
          <h4>Articles ({order.products?.length || 0})</h4>
          <div className="aop-products">
            {(order.products || []).map((item, idx) => {
              // ✅ NOUVEAU
              const variantLabel = formatSelectedVariants(item.selectedVariants);

              return (
                <div className="aop-product-row" key={`${order._id}-${item.productId}-${idx}`}>
                  <img src={item.image || "/placeholder.png"} alt={item.productTitle} />
                  <div className="aop-product-info">
                    <span className="aop-product-title">{item.productTitle}</span>
                    {/* ✅ NOUVEAU */}
                    {variantLabel && (
                      <span className="aop-product-variant">{variantLabel}</span>
                    )}
                    <span className="aop-product-qty">Qté : {item.quantity}</span>
                  </div>
                  <span className="aop-product-price">
                    {((item.price || 0) * (item.quantity || 0)).toLocaleString()} FCFA
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="aop-section">
          <h4>Paiement</h4>
          <div className="aop-summary-row">
            <span>Sous-total</span>
            <span>{(order.subTotalAmt || 0).toLocaleString()} FCFA</span>
          </div>
          <div className="aop-summary-row">
            <span>Livraison</span>
            <span>{(order.shippingAmt || 0).toLocaleString()} FCFA</span>
          </div>
          <div className="aop-summary-row">
            <span>Taxes</span>
            <span>{(order.taxAmt || 0).toLocaleString()} FCFA</span>
          </div>
          <div className="aop-summary-row aop-summary-total">
            <span>Total</span>
            <span>{(order.totalAmt || 0).toLocaleString()} FCFA</span>
          </div>
          {order.paymentId && (
            <p className="aop-payment-id">ID de transaction : {order.paymentId}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminOrderDetailsPanel;