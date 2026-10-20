// 📁 pages/myaccount/orders/OrderDetail.jsx — NOUVEAU

import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa";
import OrderReceipt from "../../../components/OrderReceipt/OrderReceipt";
import { ToastContext } from "../../../context/ToastContext";
import { fetchDataFromApi, postDataFromApi } from "../../utils/api";

const OrderDetail = () => {
  const { orderId } = useParams();
  const { openToast } = useContext(ToastContext);
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  useEffect(() => {
    fetchDataFromApi(`/api/order/detail/${orderId}`).then((res) => {
      if (res?.success) {
        setOrder(res.data);
      } else {
        setNotFound(true);
      }
    });
  }, [orderId]);

  const handleResendReceipt = async () => {
    setSendingReceipt(true);
    try {
      const response = await postDataFromApi(
        `/api/order/resend-receipt/${encodeURIComponent(order.orderId)}`,
        {},
      );
      if (response?.success) {
        openToast("success", response.message);
      } else {
        openToast("error", response?.message || "Échec de l'envoi du reçu");
      }
    } catch {
      openToast("error", "Erreur réseau lors de l'envoi du reçu");
    } finally {
      setSendingReceipt(false);
    }
  };

  if (notFound) return <p>Commande introuvable.</p>;
  if (!order) return null; // TODO: loader

  return (
    <div className="od-page">
      <Link to="/account/orders" className="od-back-link">
        <FaArrowLeft /> Retour à mes commandes
      </Link>
      <h2>Commande {order.orderId}</h2>
      <button
        className="od-resend-receipt"
        type="button"
        onClick={handleResendReceipt}
        disabled={sendingReceipt}
      >
        <FaEnvelope />
        {sendingReceipt ? "Envoi en cours..." : "Renvoyer le reçu par e-mail"}
      </button>
      <OrderReceipt order={order} />
    </div>
  );
};

export default OrderDetail;