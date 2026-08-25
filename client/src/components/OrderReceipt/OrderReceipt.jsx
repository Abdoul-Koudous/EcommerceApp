// 📁 components/OrderReceipt/OrderReceipt.jsx — MODIFIÉ

import React from "react";
import { FaDownload } from "react-icons/fa";
import "./orderreceipt.scss";

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

const paymentMethodLabel = (order) => {
  if (order.payment_status?.includes("livraison")) return "Paiement à la livraison";
  if (order.paymentId?.startsWith("pi_") || (order.paymentId?.length || 0) > 15) return "FedaPay";
  if (order.paymentId) return "KkiaPay";
  return "—";
};

// order : l'objet commande complet (même forme que celui stocké en base)
const OrderReceipt = ({ order }) => {
  const addr = order.delivery_address || {};

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="or-receipt">
      {/* ✅ AJOUT — masqué à l'impression via .or-download-btn { display: none } dans @media print */}
      <div className="or-download-bar">
        <button className="or-download-btn" onClick={handleDownload}>
          <FaDownload /> Télécharger le reçu
        </button>
      </div>

      <div className="or-products">
        {order.products?.map((item, i) => {
          const variantLabel = formatSelectedVariants(item.selectedVariants);
          return (
            <div className="or-product-line" key={i}>
              <img src={item.image || "/placeholder.png"} alt={item.productTitle} />
              <div className="or-product-line-info">
                <span className="or-product-name">{item.productTitle}</span>
                {variantLabel && <span className="or-product-variant">{variantLabel}</span>}
                <span className="or-product-qty">Quantité : {item.quantity}</span>
              </div>
              <span className="or-product-price">
                {(item.price * item.quantity).toLocaleString()} FCFA
              </span>
            </div>
          );
        })}
      </div>

      <div className="or-totals">
        <div className="or-total-row">
          <span>Sous-total</span>
          <span>{(order.subTotalAmt || 0).toLocaleString()} FCFA</span>
        </div>
        <div className="or-total-row">
          <span>Expédition</span>
          <span>{(order.shippingAmt || 0).toLocaleString()} FCFA</span>
        </div>
        <div className="or-total-row">
          <span>Taxes</span>
          <span>{(order.taxAmt || 0).toLocaleString()} FCFA</span>
        </div>
        <div className="or-total-row or-grand-total">
          <span>Total</span>
          <span>{(order.totalAmt || 0).toLocaleString()} FCFA</span>
        </div>
      </div>

      {order.payment_status?.includes("livraison") && (
        <div className="or-cod-notice">
          💵 Préparez le montant exact de{" "}
          <strong>{(order.totalAmt || 0).toLocaleString()} FCFA</strong> à remettre au
          livreur lors de la réception.
        </div>
      )}

      <div className="or-meta">
        <div className="or-meta-row">
          <span>Méthode de paiement</span>
          <strong>{paymentMethodLabel(order)}</strong>
        </div>
        <div className="or-meta-row">
          <span>Statut</span>
          <strong>{order.order_status || "Reçue"}</strong>
        </div>
        <div className="or-meta-row or-address-row">
          <span>Adresse de livraison</span>
          <strong>
            {addr.name} — {addr.address_line1}
            {addr.landmark && `, ${addr.landmark}`}, {addr.city}, {addr.state}{" "}
            {addr.country}
            <br />
            {addr.mobile}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;