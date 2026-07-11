import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa";
import "./checkout.scss";
import { useKKiaPay } from "kkiapay-react";

import { UserContext } from "../../UserContext/UserContext";
import { editData, fetchDataFromApi, postData } from "../utils/api";
import AddressPanel from "../myaccount/addresspanel";
import { ToastContext } from "../../context/ToastContext";

const Checkout = () => {
  const { user, cartItems, loadCartItems } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const [panelMode, setPanelMode] = useState("add");
  const [editingAddress, setEditingAddress] = useState(null);

  // Ref pour toujours avoir la valeur à jour de l'adresse sélectionnée
  // dans les callbacks KkiaPay (évite le problème de "stale closure")
  const selectedAddressIdRef = useRef(selectedAddressId);
  useEffect(() => {
    selectedAddressIdRef.current = selectedAddressId;
  }, [selectedAddressId]);

  const handleOpenAdd = () => {
    setPanelMode("add");
    setEditingAddress(null);
    setPanelOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setPanelMode("edit");
    setEditingAddress(addr);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setPanelMode("add");
    setEditingAddress(null);
  };

  const shipping = 500;
  const taxRate = 0.18;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const taxes = subtotal * taxRate;
  const total = subtotal + shipping + taxes;

  const loadAddresses = () => {
    if (!user?._id) return;

    fetchDataFromApi(`/api/address/get?userId=${user._id}`).then((res) => {
      if (!res?.error) {
        setAddresses(res.data || []);
        const selected = (res.data || []).find((addr) => addr.selected);
        setSelectedAddressId(selected ? selected._id : null);
      } else {
        openToast(
          "error",
          res?.message || "Impossible de charger les adresses",
        );
      }
    });
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const handleSelectAddress = async (id) => {
    if (id === selectedAddressId) return;

    const previous = selectedAddressId;
    setSelectedAddressId(id);

    try {
      const res = await editData(`/api/address/selectaddress/${id}`, {
        selected: true,
      });

      if (res?.success) {
        loadAddresses();
      } else {
        setSelectedAddressId(previous);
        openToast("error", res?.message || "Erreur lors de la sélection");
      }
    } catch (err) {
      setSelectedAddressId(previous);
      openToast("error", "Erreur serveur lors de la sélection");
    }
  };

  const handleSubmitAddress = async (formFields) => {
    if (!formFields.name.trim())
      return openToast("error", "Le nom du destinataire est requis");
    if (!formFields.address_line1.trim())
      return openToast("error", "L'adresse est requise");
    if (!formFields.city.trim())
      return openToast("error", "La ville est requise");
    if (!formFields.state.trim())
      return openToast("error", "L'état / la région est requis");
    if (!formFields.pincode.trim())
      return openToast("error", "Le code postal est requis");
    if (!formFields.country.trim())
      return openToast("error", "Le pays est requis");
    if (!formFields.mobile || formFields.mobile.trim().length < 8)
      return openToast("error", "Un numéro de téléphone valide est requis");

    try {
      let res;

      if (panelMode === "edit" && editingAddress) {
        res = await editData(
          `/api/address/update/${editingAddress._id}`,
          formFields,
        );
      } else {
        res = await postData("/api/address/add", formFields);
      }

      if (res?.success) {
        openToast(
          "success",
          res?.message ||
            (panelMode === "edit"
              ? "Adresse modifiée avec succès"
              : "Adresse ajoutée avec succès"),
        );
        handleClosePanel();
        loadAddresses();
      } else {
        openToast("error", res?.message || "Erreur serveur");
      }
    } catch (err) {
      openToast("error", "Erreur réseau lors de l'enregistrement");
    }
  };

  // ============================
  // === PAIEMENT FEDAPAY ===
  // ============================
  const handlePay = () => {
    if (!selectedAddressId) {
      openToast("error", "Veuillez sélectionner une adresse de livraison");
      return;
    }
    if (cartItems.length === 0) {
      openToast("error", "Votre panier est vide");
      return;
    }

    const FedaPay = window["FedaPay"];
    if (!FedaPay) {
      openToast("error", "Le module de paiement n'est pas chargé");
      return;
    }

    console.log("[FedaPay] Ouverture du widget...");

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
    const [firstname, ...rest] = (user?.name || "Client").split(" ");
    const lastname = rest.join(" ") || "N/A";

    FedaPay.init({
      public_key: import.meta.env.VITE_FEDAPAY_PUBLIC_KEY,
      transaction: {
        amount: Math.round(total),
        description: `Commande - ${cartItems.length} article(s)`,
      },
      currency: { iso: "XOF" },
      customer: {
        email: user?.email,
        firstname,
        lastname,
        phone_number: {
          number: (selectedAddress?.mobile || "").replace(/\D/g, ""),
          country: "bj",
        },
      },
      onComplete: (resp) => {
        console.log("[FedaPay] onComplete déclenché:", resp);
        console.log("[FedaPay] Transaction:", resp.transaction);

        if (resp.reason === FedaPay.DIALOG_DISMISSED) {
          console.log("[FedaPay] Paiement annulé par l'utilisateur");
          openToast("info", "Paiement annulé");
          return;
        }
        if (resp.transaction.status === "approved") {
          console.log("[FedaPay] Statut approuvé, vérification serveur...");
          verifyPayment(resp.transaction.id);
        } else {
          console.log(
            "[FedaPay] Statut non approuvé:",
            resp.transaction.status,
          );
          openToast("error", "Le paiement n'a pas été approuvé");
        }
      },
    }).open();
  };

  const verifyPayment = async (transactionId) => {
    console.log(
      "[FedaPay] Appel /api/payment/verify avec transactionId:",
      transactionId,
    );
    try {
      const res = await postData("/api/payment/verify", {
        transactionId,
        addressId: selectedAddressIdRef.current,
      });

      console.log("[FedaPay] Réponse /api/payment/verify:", res);

      if (res?.success) {
        openToast("success", "Paiement confirmé, commande créée avec succès !");
        loadCartItems(); // 🔄 recharge le panier (maintenant vide)
        navigate("/order/success", { state: { order: res.data } });
      } else {
        openToast(
          "error",
          res?.message || "Erreur lors de la confirmation du paiement",
        );
      }
    } catch (err) {
      console.error("[FedaPay] Erreur lors de la vérification:", err);
      openToast("error", "Erreur serveur lors de la vérification du paiement");
    }
  };

  // ============================
  // === PAIEMENT KKIAPAY ===
  // ============================
  const { openKkiapayWidget, addSuccessListener } = useKKiaPay();

  useEffect(() => {
    console.log("[KkiaPay] Enregistrement du addSuccessListener...");

    addSuccessListener((response) => {
      console.log(
        "[KkiaPay] addSuccessListener déclenché ! Réponse complète:",
        response,
      );
      const transactionId = response?.transactionId;

      if (!transactionId) {
        console.error(
          "[KkiaPay] Aucun transactionId dans la réponse !",
          response,
        );
        openToast(
          "error",
          "Impossible de récupérer l'identifiant de transaction",
        );
        return;
      }

      verifyKkiapayPayment(transactionId);
    });

    console.log("[KkiaPay] Listener enregistré avec succès");
  }, [addSuccessListener]);

  const handlePayKkiapay = () => {
    if (!selectedAddressId) {
      openToast("error", "Veuillez sélectionner une adresse de livraison");
      return;
    }
    if (cartItems.length === 0) {
      openToast("error", "Votre panier est vide");
      return;
    }

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

    const widgetConfig = {
      amount: Math.round(total),
      key: import.meta.env.VITE_KKIAPAY_PUBLIC_KEY,
      sandbox: true, // à retirer en production
      phone: (selectedAddress?.mobile || "").replace(/\D/g, ""),
      email: user?.email,
      name: user?.name || "Client",
      reason: `Commande - ${cartItems.length} article(s)`,
    };

    console.log("[KkiaPay] Ouverture du widget avec config:", widgetConfig);

    openKkiapayWidget(widgetConfig);
  };

  const verifyKkiapayPayment = async (transactionId) => {
    const addressId = selectedAddressIdRef.current;

    console.log(
      "[KkiaPay] Appel /api/payment/verify-kkiapay avec transactionId:",
      transactionId,
      "addressId:",
      addressId,
    );
    try {
      const res = await postData("/api/payment/verify-kkiapay", {
        transactionId,
        addressId,
      });

      console.log("[KkiaPay] Réponse /api/payment/verify-kkiapay:", res);

      if (res?.success) {
        openToast("success", "Paiement confirmé, commande créée avec succès !");
        loadCartItems(); // 🔄 recharge le panier (maintenant vide)
        navigate("/order/success", { state: { order: res.data } });
      } else {
        openToast(
          "error",
          res?.message || "Erreur lors de la confirmation du paiement",
        );
      }
    } catch (err) {
      console.error("[KkiaPay] Erreur lors de la vérification:", err);
      openToast("error", "Erreur serveur lors de la vérification du paiement");
    }
  };

  const [loadingCod, setLoadingCod] = useState(false);

  const handlePayCashOnDelivery = async () => {
    if (!selectedAddressId) {
      openToast("error", "Veuillez sélectionner une adresse de livraison");
      return;
    }
    if (cartItems.length === 0) {
      openToast("error", "Votre panier est vide");
      return;
    }

    setLoadingCod(true);
    console.log(
      "[COD] Création de la commande avec paiement à la livraison...",
    );

    try {
      const res = await postData("/api/payment/cash-on-delivery", {
        addressId: selectedAddressId,
      });

      console.log("[COD] Réponse:", res);

      if (res?.success) {
        openToast("success", "Commande créée ! Vous paierez à la livraison.");
        loadCartItems();
        navigate("/order/success", { state: { order: res.data } });
      } else {
        openToast(
          "error",
          res?.message || "Erreur lors de la création de la commande",
        );
      }
    } catch (err) {
      console.error("[COD] Erreur:", err);
      openToast("error", "Erreur serveur lors de la création de la commande");
    } finally {
      setLoadingCod(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* === Bloc gauche : Adresse de livraison === */}
        <div className="billing-details">
          <div className="section-header">
            <h2>Adresse de livraison</h2>
            <button className="btn-add-new-address" onClick={handleOpenAdd}>
              + Ajouter une adresse
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="no-address-block">
              <img
                src="/empty-address.png"
                alt="Aucune adresse"
                className="no-address-img"
              />
              <p>Aucune adresse trouvée dans votre compte !</p>
              <span>Ajoutez une adresse de livraison.</span>
              <button className="btn-add-address-cta" onClick={handleOpenAdd}>
                Ajouter une adresse
              </button>
            </div>
          ) : (
            <div className="checkout-address-list">
              {addresses.map((addr) => (
                <div
                  className={`checkout-address-card ${selectedAddressId === addr._id ? "selected" : ""}`}
                  key={addr._id}
                  onClick={() => handleSelectAddress(addr._id)}
                >
                  <input
                    type="radio"
                    name="checkoutAddress"
                    checked={selectedAddressId === addr._id}
                    onChange={() => handleSelectAddress(addr._id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="checkout-address-info">
                    <div className="address-top-row">
                      <span className="address-badge">{addr.addressType}</span>
                      <button
                        className="edit-address-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(addr);
                        }}
                      >
                        <FaPen />
                      </button>
                    </div>
                    <p className="address-name">
                      <strong>{addr.name}</strong>
                    </p>
                    <p className="address-full">
                      {addr.address_line1}
                      {addr.landmark && `, ${addr.landmark}`}, {addr.city},{" "}
                      {addr.state} {addr.country} {addr.pincode}
                    </p>
                    <p className="address-phone">{addr.mobile}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === Bloc droite: Votre commande === */}
        <div className="order-summary">
          <h2>Votre commande</h2>

          <div className="order-items">
            {cartItems.length === 0 ? (
              <p className="empty-order">Votre panier est vide.</p>
            ) : (
              cartItems.map((item) => (
                <div className="order-item" key={item._id}>
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.productTitle}
                  />
                  <div className="item-info">
                    <span className="item-name">
                      {item.productTitle.length > 30
                        ? item.productTitle.substring(0, 30) + "..."
                        : item.productTitle}
                    </span>
                    <span className="item-quantity">
                      Quantité: {item.quantity}
                    </span>
                  </div>
                  <span className="item-price">
                    {(item.price * item.quantity).toLocaleString()} FCFA
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="total-row">
            <span>Sous-total</span>
            <span>{subtotal.toLocaleString()} FCFA</span>
          </div>
          <div className="total-row">
            <span>Expédition</span>
            <span>{shipping.toLocaleString()} FCFA</span>
          </div>
          <div className="total-row">
            <span>Taxes (18%)</span>
            <span>{taxes.toLocaleString()} FCFA</span>
          </div>
          <div className="total-row grand-total">
            <span>Total</span>
            <span>{total.toLocaleString()} FCFA</span>
          </div>

          <button className="btn-pay" onClick={handlePay}>
            Payer avec FedaPay
          </button>
          <button
            className="btn-pay btn-pay-kkiapay"
            onClick={handlePayKkiapay}
          >
            Payer avec KkiaPay
          </button>
          <button
            className="btn-pay btn-pay-cod"
            onClick={handlePayCashOnDelivery}
            disabled={loadingCod}
          >
            {loadingCod ? "Traitement..." : "Payer à la livraison"}
          </button>
        </div>
      </div>

      <AddressPanel
        isOpen={panelOpen}
        onClose={handleClosePanel}
        mode={panelMode}
        editingAddress={editingAddress}
        onSubmit={handleSubmitAddress}
      />

      {panelOpen && (
        <div className="address-panel-overlay" onClick={handleClosePanel} />
      )}
    </div>
  );
};

export default Checkout;