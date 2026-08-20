import React from "react";
import { FaTimes } from "react-icons/fa";
import { orderStatusInfo, paymentStatusInfo } from "../utils/orderStatus";
import "./OrderDetailsPanel.scss";

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

const OrderDetailsPanel = ({ order, userName, userEmail, userMobile, onClose }) => {
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

        {/* Le compte connecté qui a passé la commande */}
        <div className="panel-section">
          <h4>Compte</h4>
          <p><strong>{userName || "—"}</strong></p>
          <p>{userEmail || "—"}</p>
          <p className={!userMobile ? "field-missing" : ""}>
            {userMobile || "Téléphone non renseigné"}
          </p>
        </div>

        {/* Le destinataire réel du colis — peut être quelqu'un d'autre que le
            compte (cadeau, livraison bureau, etc.), donc affiché séparément
            avec son propre nom et téléphone, à côté de l'adresse. */}
        <div className="panel-section">
          <h4>Destinataire de la livraison</h4>
          {addr ? (
            <>
              <span className="address-badge">{addr.addressType || "—"}</span>
              <p><strong>{addr.name || "—"}</strong></p>
              <p>{addr.mobile || "—"}</p>
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
            {order.products.map((item, idx) => {
              // ✅ NOUVEAU
              const variantLabel = formatSelectedVariants(item.selectedVariants);

              return (
                <div className="panel-product-row" key={`${order._id}-${item.productId}-${idx}`}>
                  <img src={item.image || "/placeholder.png"} alt={item.productTitle} />
                  <div className="panel-product-info">
                    <span className="panel-product-title">{item.productTitle}</span>
                    {/* ✅ NOUVEAU */}
                    {variantLabel && (
                      <span className="panel-product-variant">{variantLabel}</span>
                    )}
                    <span className="panel-product-qty">Qté : {item.quantity}</span>
                  </div>
                  <span className="panel-product-price">
                    {(item.price * item.quantity).toLocaleString()} FCFA
                  </span>
                </div>
              );
            })}
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