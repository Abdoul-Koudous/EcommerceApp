import React from "react";
import OrdersTabPage from "../myaccount/orderstabpage";

const Orders = () => {
  return (
    <div className="orders-page">
      <div className="dsh-recent-orders">
        <h2>Commandes</h2>
        <OrdersTabPage />
      </div>
    </div>
  );
};

export default Orders;