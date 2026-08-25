// 📁 pages/myaccount/orders/OrderDetail.jsx — NOUVEAU

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import OrderReceipt from "../../../components/OrderReceipt/OrderReceipt";
import { fetchDataFromApi } from "../../utils/api";

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchDataFromApi(`/api/order/detail/${orderId}`).then((res) => {
      if (res?.success) {
        setOrder(res.data);
      } else {
        setNotFound(true);
      }
    });
  }, [orderId]);

  if (notFound) return <p>Commande introuvable.</p>;
  if (!order) return null; // TODO: loader

  return (
    <div className="od-page">
      <Link to="/account/orders" className="od-back-link">
        <FaArrowLeft /> Retour à mes commandes
      </Link>
      <h2>Commande {order.orderId}</h2>
      <OrderReceipt order={order} />
    </div>
  );
};

export default OrderDetail;