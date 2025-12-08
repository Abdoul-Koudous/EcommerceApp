import React, { useState } from "react";
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";
import "./orderstab.scss";

const OrdersTabPage = () => {
  const [openOrder, setOpenOrder] = useState(null);

  const orders = [
    {
      id: "CMD-1024",
      paymentId: "PAY-9876",
      name: "KORIKO Abdoul-Koudous",
      phone: "+229 97000000",
      address: "Cotonou, Akpakpa",
      pincode: "BJ-00229",
      total: 85000,
      email: "koriko@example.com",
      userId: "USR-2201",
      date: "12 Oct 2025",
      status: "Livré",
      items: [
        { id: "PRD-1001", name: "SSD 500GB", qty: 1, price: 35000, image: "/od11.jpg" },
        { id: "PRD-1002", name: "Casque Bluetooth", qty: 1, price: 15000, image: "/od21.jpg" },
        { id: "PRD-1003", name: "Clavier RGB", qty: 1, price: 35000, image: "/od31.jpg" },
      ],
    },
    {
      id: "CMD-1025",
      paymentId: "PAY-9910",
      name: "Amadou Ibrahim",
      phone: "+229 96012345",
      address: "Parakou, Quartier Albarika",
      pincode: "BJ-00212",
      total: 42000,
      email: "amadou@example.com",
      userId: "USR-2202",
      date: "22 Oct 2025",
      status: "En cours",
      items: [
        { id: "PRD-1004", name: "Souris Gaming", qty: 1, price: 22000, image: "/od21.jpg" },
        { id: "PRD-1005", name: "Tapis RGB", qty: 1, price: 20000, image: "/od31.jpg" },
      ],
    },
  ];

  const toggleOrder = (id) => {
    setOpenOrder(openOrder === id ? null : id);
  };

  return (
    <div className="tab-content orders-tab">
      {orders.length === 0 ? (
        <p>Vous n’avez pas encore passé de commande.</p>
      ) : (
        <div className="orders-wrapper">
          <div className="orders-table">
            {/* === Header === */}
            <div className="table-header">
              <span></span>
              <span>ID C</span>
              <span>ID P</span>
              <span>Nom</span>
              <span>Téléphone</span>
              <span>Adresse</span>
              <span>Pincode</span>
              <span>Total</span>
              <span>Email</span>
              <span>U ID</span>
              <span>Date</span>
              <span>Statut</span>
            </div>

            {orders.map((order) => (
              <div key={order.id} className="order-row">
                <div
                  className={`order-summary ${openOrder === order.id ? "active" : ""}`}
                  onClick={() => toggleOrder(order.id)}
                >
                  <span className={`arrow-icon ${openOrder === order.id ? "up" : "down"}`}>
                    <MdOutlineKeyboardArrowUp />
                  </span>

                  <span>{order.id}</span>
                  <span>{order.paymentId}</span>
                  <span>{order.name}</span>
                  <span>{order.phone}</span>
                  <span>{order.address}</span>
                  <span>{order.pincode}</span>
                  <span>{order.total.toLocaleString()} FCFA</span>
                  <span>{order.email}</span>
                  <span>{order.userId}</span>
                  <span>{order.date}</span>
                  <span className={`status ${order.status === "Livré" ? "delivered" : "pending"}`}>
                    {order.status}
                  </span>
                </div>

                {openOrder === order.id && (
                  <div className="order-details">
                    <table>
                      <thead>
                        <tr>
                          <th>ID Produit</th>
                          <th>Produit</th>
                          <th>Image</th>
                          <th>Quantité</th>
                          <th>Prix</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>
                              <img src={item.image} alt={item.name} className="product-image" />
                            </td>
                            <td>{item.qty}</td>
                            <td>{item.price.toLocaleString()} FCFA</td>
                            <td>{(item.price * item.qty).toLocaleString()} FCFA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTabPage;
