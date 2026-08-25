// 📁 pages/ordersuccess/OrderSuccess.jsx — MODIFIÉ

import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaCheckCircle, FaBoxOpen, FaHome } from "react-icons/fa";
import OrderReceipt from "../../components/OrderReceipt/OrderReceipt";
import "./ordersuccess.scss";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    if (!order) navigate("/");
  }, [order, navigate]);

  if (!order) return null;

  return (
    <div className="os-page">
      <div className="os-card">
        <FaCheckCircle className="os-success-icon" />
        <h1>Commande confirmée !</h1>
        <p className="os-subtitle">
          Merci pour votre confiance. Voici le récapitulatif de votre commande{" "}
          <strong>{order.orderId}</strong>.
        </p>

        <OrderReceipt order={order} />

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