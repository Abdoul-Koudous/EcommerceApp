import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaCheckCircle, FaBoxOpen, FaHome } from "react-icons/fa";
import "./ordersuccess.scss";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      navigate("/");
    }
  }, [order, navigate]);

  if (!order) return null;

  const paymentMethodLabel = () => {
    if (order.payment_status?.includes("livraison")) return "Paiement à la livraison";
    if (order.paymentId?.startsWith("pi_") || order.paymentId?.length > 15) return "FedaPay";
    return "KkiaPay";
  };

  return (
    <div className="os-page">
      <div className="os-card">
        <FaCheckCircle className="os-success-icon" />

        <h1>Commande confirmée !</h1>
        <p className="os-subtitle">
          Merci pour votre confiance. Voici le récapitulatif de votre commande.
        </p>

        <div className="os-info-box">
          <div className="os-info-row">
            <span>Numéro de commande</span>
            <strong>{order.orderId}</strong>
          </div>
          <div className="os-info-row">
            <span>Méthode de paiement</span>
            <strong>{paymentMethodLabel()}</strong>
          </div>
          <div className="os-info-row">
            <span>Statut</span>
            <strong className="os-status-badge">{order.order_status || "En attente"}</strong>
          </div>
          <div className="os-info-row os-total">
            <span>Total payé</span>
            <strong>{order.totalAmt?.toLocaleString()} FCFA</strong>
          </div>
        </div>

        <div className="os-products">
          <h3>Articles commandés</h3>
          {order.products?.map((item, i) => (
            <div className="os-product-line" key={i}>
              <img src={item.image || "/placeholder.png"} alt={item.productTitle} />
              <div className="os-product-line-info">
                <span className="os-product-name">{item.productTitle}</span>
                <span className="os-product-qty">Quantité : {item.quantity}</span>
              </div>
              <span className="os-product-price">
                {(item.price * item.quantity).toLocaleString()} FCFA
              </span>
            </div>
          ))}
        </div>

        {order.payment_status?.includes("livraison") && (
          <div className="os-cod-notice">
            💵 Préparez le montant exact de <strong>{order.totalAmt?.toLocaleString()} FCFA</strong> à
            remettre au livreur lors de la réception de votre commande.
          </div>
        )}

        <div className="os-next-steps">
          <h3>Et maintenant ?</h3>
          <ul>
            <li>Vous recevrez une confirmation par email sous peu.</li>
            <li>Votre commande sera préparée puis expédiée sous 24 à 72h.</li>
            <li>Vous pouvez suivre l'état de votre commande à tout moment depuis votre compte.</li>
          </ul>
        </div>

        <div className="os-action-buttons">
          <Link to="/account/orders" className="os-btn-primary">
            <FaBoxOpen /> Voir mes commandes
          </Link>
          <Link to="/" className="os-btn-secondary">
            <FaHome /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;