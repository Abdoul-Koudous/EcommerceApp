import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa";
import "./checkout.scss";
import { useKKiaPay } from "kkiapay-react";

import { UserContext } from "../../UserContext/UserContext";
import { editData, fetchDataFromApi, postData } from "../utils/api";
import AddressPanel from "../myaccount/addresspanel";
import { ToastContext } from "../../context/ToastContext";

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

const Checkout = () => {
  const { user, cartItems, loadCartItems } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const [panelMode, setPanelMode] = useState("add");
  const [editingAddress, setEditingAddress] = useState(null);

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

  const [totals, setTotals] = useState({
    subTotalAmt: 0,
    shippingAmt: 0,
    taxAmt: 0,
    totalAmt: 0,
  });

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

  useEffect(() => {
    if (cartItems.length === 0) {
      setTotals({ subTotalAmt: 0, shippingAmt: 0, taxAmt: 0, totalAmt: 0 });
      return;
    }

    const city = selectedAddress?.city || "";

    fetchDataFromApi(
      `/api/payment/preview-total?city=${encodeURIComponent(city)}`,
    ).then((res) => {
      if (!res?.error) {
        setTotals({
          subTotalAmt: res.subTotalAmt || 0,
          shippingAmt: res.shippingAmt || 0,
          taxAmt: res.taxAmt || 0,
          totalAmt: res.totalAmt || 0,
        });
      }
    });
  }, [cartItems, selectedAddress?.city]);

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

    const [firstname, ...rest] = (user?.name || "Client").split(" ");
    const lastname = rest.join(" ") || "N/A";

    FedaPay.init({
      public_key: import.meta.env.VITE_FEDAPAY_PUBLIC_KEY,
      transaction: {
        amount: Math.round(totals.totalAmt),
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
        if (resp.reason === FedaPay.DIALOG_DISMISSED) {
          openToast("info", "Paiement annulé");
          return;
        }
        if (resp.transaction.status === "approved") {
          verifyPayment(resp.transaction.id);
        } else {
          openToast("error", "Le paiement n'a pas été approuvé");
        }
      },
    }).open();
  };

  const verifyPayment = async (transactionId) => {
    try {
      const res = await postData("/api/payment/verify", {
        transactionId,
        addressId: selectedAddressIdRef.current,
      });

      if (res?.success) {
        openToast("success", "Paiement confirmé, commande créée avec succès !");
        loadCartItems();
        navigate("/order/success", { state: { order: res.data } });
      } else {
        openToast(
          "error",
          res?.message || "Erreur lors de la confirmation du paiement",
        );
      }
    } catch (err) {
      openToast("error", "Erreur serveur lors de la vérification du paiement");
    }
  };

  const { openKkiapayWidget, addSuccessListener } = useKKiaPay();

  useEffect(() => {
    addSuccessListener((response) => {
      const transactionId = response?.transactionId;

      if (!transactionId) {
        openToast(
          "error",
          "Impossible de récupérer l'identifiant de transaction",
        );
        return;
      }

      verifyKkiapayPayment(transactionId);
    });
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

    const widgetConfig = {
      amount: Math.round(totals.totalAmt),
      key: import.meta.env.VITE_KKIAPAY_PUBLIC_KEY,
      sandbox: true,
      phone: (selectedAddress?.mobile || "").replace(/\D/g, ""),
      email: user?.email,
      name: user?.name || "Client",
      reason: `Commande - ${cartItems.length} article(s)`,
    };

    openKkiapayWidget(widgetConfig);
  };

  const verifyKkiapayPayment = async (transactionId) => {
    const addressId = selectedAddressIdRef.current;

    try {
      const res = await postData("/api/payment/verify-kkiapay", {
        transactionId,
        addressId,
      });

      if (res?.success) {
        openToast("success", "Paiement confirmé, commande créée avec succès !");
        loadCartItems();
        navigate("/order/success", { state: { order: res.data } });
      } else {
        openToast(
          "error",
          res?.message || "Erreur lors de la confirmation du paiement",
        );
      }
    } catch (err) {
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

    try {
      const res = await postData("/api/payment/cash-on-delivery", {
        addressId: selectedAddressId,
      });

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
      openToast("error", "Erreur serveur lors de la création de la commande");
    } finally {
      setLoadingCod(false);
    }
  };

  return (
    <div className="co-page">
      <div className="co-container">
        {/* === Bloc gauche : Adresse de livraison === */}
        <div className="co-billing-details">
          <div className="co-section-header">
            <h2>Adresse de livraison</h2>
            <button className="co-btn-add-new-address" onClick={handleOpenAdd}>
              + Ajouter une adresse
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="co-no-address-block">
              <img
                src="/empty-address.png"
                alt="Aucune adresse"
                className="co-no-address-img"
              />
              <p>Aucune adresse trouvée dans votre compte !</p>
              <span>Ajoutez une adresse de livraison.</span>
              <button className="co-btn-add-address-cta" onClick={handleOpenAdd}>
                Ajouter une adresse
              </button>
            </div>
          ) : (
            <div className="co-address-list">
              {addresses.map((addr) => (
                <div
                  className={`co-address-card ${selectedAddressId === addr._id ? "co-selected" : ""}`}
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
                  <div className="co-address-info">
                    <div className="co-address-top-row">
                      <span className="co-address-badge">{addr.addressType}</span>
                      <button
                        className="co-edit-address-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(addr);
                        }}
                      >
                        <FaPen />
                      </button>
                    </div>
                    <p className="co-address-name">
                      <strong>{addr.name}</strong>
                    </p>
                    <p className="co-address-full">
                      {addr.address_line1}
                      {addr.landmark && `, ${addr.landmark}`}, {addr.city},{" "}
                      {addr.state} {addr.country} {addr.pincode}
                    </p>
                    <p className="co-address-phone">{addr.mobile}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === Bloc droite: Votre commande === */}
        <div className="co-order-summary">
          <h2>Votre commande</h2>

          <div className="co-order-items">
            {cartItems.length === 0 ? (
              <p className="co-empty-order">Votre panier est vide.</p>
            ) : (
              cartItems.map((item) => {
                // ✅ NOUVEAU
                const variantLabel = formatSelectedVariants(
                  item.selectedVariants,
                );

                return (
                  <div className="co-order-item" key={item._id}>
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.productTitle}
                    />
                    <div className="co-item-info">
                      <span className="co-item-name">
                        {item.productTitle.length > 30
                          ? item.productTitle.substring(0, 30) + "..."
                          : item.productTitle}
                      </span>
                      {/* ✅ NOUVEAU */}
                      {variantLabel && (
                        <span className="co-item-variant">{variantLabel}</span>
                      )}
                      <span className="co-item-quantity">
                        Quantité: {item.quantity}
                      </span>
                    </div>
                    <span className="co-item-price">
                      {(item.price * item.quantity).toLocaleString()} FCFA
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="co-total-row">
            <span>Sous-total</span>
            <span>{totals.subTotalAmt.toLocaleString()} FCFA</span>
          </div>
          <div className="co-total-row">
            <span>Expédition</span>
            <span>{totals.shippingAmt.toLocaleString()} FCFA</span>
          </div>
          <div className="co-total-row">
            <span>Taxes</span>
            <span>{totals.taxAmt.toLocaleString()} FCFA</span>
          </div>
          <div className="co-total-row co-grand-total">
            <span>Total</span>
            <span>{totals.totalAmt.toLocaleString()} FCFA</span>
          </div>

          <button className="co-btn-pay" onClick={handlePay}>
            Payer avec FedaPay
          </button>
          <button
            className="co-btn-pay co-btn-pay-kkiapay"
            onClick={handlePayKkiapay}
          >
            Payer avec KkiaPay
          </button>
          <button
            className="co-btn-pay co-btn-pay-cod"
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
        <div className="co-address-panel-overlay" onClick={handleClosePanel} />
      )}
    </div>
  );
};

export default Checkout;