import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa";
import "./checkout.scss";
import { useKKiaPay } from "kkiapay-react";

import { UserContext } from "../../UserContext/UserContext";
import { editData, fetchDataFromApi, postData } from "../utils/api";
import AddressPanel from "../myaccount/addresspanel";
import { ToastContext } from "../../context/ToastContext";
import { trackEvent } from "../utils/tracking";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

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

const KKIAPAY_SANDBOX_SUCCESS_PHONE = "22961000000";
const KKIAPAY_SANDBOX =
  import.meta.env.VITE_KKIAPAY_SANDBOX?.trim().toLowerCase() !== "false";

const Checkout = () => {
  const { user, cartItems, setCartItems, loading } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const [panelMode, setPanelMode] = useState("add");
  const [editingAddress, setEditingAddress] = useState(null);

  const selectedAddressIdRef = useRef(selectedAddressId);
  const paymentAttemptReferenceRef = useRef(null);
  // 🔒 Verrou : évite de traiter deux fois la même transaction KkiaPay
  // (par exemple si le listener du widget se déclenche en double).
  const processedTransactionsRef = useRef(new Set());

  // ⏳ État du paiement KkiaPay, pour l'indicateur de chargement du bouton :
  //  - "idle"      : rien en cours, le bouton est utilisable
  //  - "preparing" : on crée la tentative de paiement avant d'ouvrir le widget
  //  - "verifying" : paiement fait dans le widget, le serveur vérifie auprès
  //                  de KkiaPay (jusqu'à ~8 s en Sandbox)
  const [kkiapayStatus, setKkiapayStatus] = useState("idle");
  const kkiapayBusy = kkiapayStatus !== "idle";

  useEffect(() => {
    selectedAddressIdRef.current = selectedAddressId;
  }, [selectedAddressId]);

  useEffect(() => {
    if (loading) return;
    if (!user?._id) {
      navigate("/login?redirect=/checkout");
    }
  }, [user, loading, navigate]);

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
  const [paymentMethods, setPaymentMethods] = useState({
    fedapay: true,
    kkiapay: true,
    cashOnDelivery: true,
  });

  useEffect(() => {
    fetchDataFromApi("/api/settings").then((res) => {
      if (!res?.error && res?.settings?.paymentMethods) {
        setPaymentMethods({
          fedapay: res.settings.paymentMethods.fedapay !== false,
          kkiapay: res.settings.paymentMethods.kkiapay !== false,
          cashOnDelivery: res.settings.paymentMethods.cashOnDelivery !== false,
        });
      }
    });
  }, []);

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

  useEffect(() => {
    if (cartItems.length === 0) {
      setTotals({ subTotalAmt: 0, shippingAmt: 0, taxAmt: 0, totalAmt: 0 });
      return;
    }

    let isCurrent = true;
    const city = selectedAddress?.city || "";

    fetchDataFromApi(
      `/api/payment/preview-total?city=${encodeURIComponent(city)}`,
    ).then((res) => {
      if (isCurrent && !res?.error) {
        setTotals({
          subTotalAmt: res.subTotalAmt || 0,
          shippingAmt: res.shippingAmt || 0,
          taxAmt: res.taxAmt || 0,
          totalAmt: res.totalAmt || 0,
        });
      }
    });

    return () => {
      isCurrent = false;
    };
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

  // ✅ MODIFIÉ : accepte maintenant "confirmed" — true pour un paiement en
  // ligne déjà encaissé (FedaPay/KkiaPay), false pour un paiement à la
  // livraison (pas encore d'argent réellement reçu). Le serveur confirmera
  // l'event lui-même une fois la commande marquée "Livrée".
  // 🛡️ Le suivi ne doit JAMAIS faire échouer le flux de paiement : toute
  // erreur est avalée et loggée en console.
  const trackPurchase = (order, confirmed = true) => {
    try {
      (order?.products || []).forEach((item) => {
        trackEvent("PURCHASE", {
          productId: item.productId,
          orderId: order.orderId,
          amount: item.price * item.quantity,
          confirmed,
        });
      });
    } catch (err) {
      console.error("trackPurchase a échoué:", err);
    }
  };

  const createPaymentAttempt = async (provider) => {
    try {
      const res = await postData("/api/payment/attempt", {
        provider,
        addressId: selectedAddressId,
      });
      const amount = Number(res?.data?.amount);
      if (
        !res?.success ||
        !res?.data?.reference ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        openToast("error", res?.message || "Impossible de préparer le paiement");
        return null;
      }
      return { ...res.data, amount };
    } catch {
      openToast("error", "Erreur serveur lors de la préparation du paiement");
      return null;
    }
  };

  const handlePay = async () => {
    if (!paymentMethods.fedapay) {
      openToast("error", "FedaPay n'est pas disponible sur cette boutique");
      return;
    }
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

    const attempt = await createPaymentAttempt("fedapay");
    if (!attempt) return;

    const [firstname, ...rest] = (user?.name || "Client").split(" ");
    const lastname = rest.join(" ") || "N/A";

    FedaPay.init({
      public_key: import.meta.env.VITE_FEDAPAY_PUBLIC_KEY,
      transaction: {
        amount: attempt.amount,
        description: `Commande #${attempt.reference}`,
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
          verifyPayment(resp.transaction.id, attempt.reference);
        } else {
          openToast("error", "Le paiement n'a pas été approuvé");
        }
      },
    }).open();
  };

  const verifyPayment = async (transactionId, attemptReference) => {
    try {
      const res = await postData("/api/payment/verify", {
        transactionId,
        attemptReference,
      });

      if (res?.success) {
        openToast("success", "Paiement confirmé, commande créée avec succès !");
        trackPurchase(res.data); // confirmed: true (paiement en ligne)
        setCartItems([]);
        setTotals({ subTotalAmt: 0, shippingAmt: 0, taxAmt: 0, totalAmt: 0 });
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

      verifyKkiapayPayment(
        transactionId,
        response?.stateData?.checkoutReference ||
          paymentAttemptReferenceRef.current,
      );
    });
  }, [addSuccessListener]);

  const handlePayKkiapay = async () => {
    // Un paiement KkiaPay est déjà en préparation ou en vérification
    if (kkiapayBusy) return;

    if (!paymentMethods.kkiapay) {
      openToast("error", "KkiaPay n'est pas disponible sur cette boutique");
      return;
    }
    if (!selectedAddressId) {
      openToast("error", "Veuillez sélectionner une adresse de livraison");
      return;
    }
    if (cartItems.length === 0) {
      openToast("error", "Votre panier est vide");
      return;
    }

    // ⏳ Phase 1 : préparation de la tentative de paiement
    setKkiapayStatus("preparing");

    const attempt = await createPaymentAttempt("kkiapay");
    if (!attempt) {
      setKkiapayStatus("idle");
      return;
    }
    paymentAttemptReferenceRef.current = attempt.reference;

    const widgetConfig = {
      amount: attempt.amount,
      key: import.meta.env.VITE_KKIAPAY_PUBLIC_KEY,
      sandbox: KKIAPAY_SANDBOX,
      ...(KKIAPAY_SANDBOX ? { phone: KKIAPAY_SANDBOX_SUCCESS_PHONE } : {}),
      email: user?.email,
      name: user?.name || "Client",
      reason: `Commande - ${cartItems.length} article(s)`,
      data: { checkoutReference: attempt.reference },
    };

    try {
      openKkiapayWidget(widgetConfig);
    } catch (err) {
      console.error("Ouverture du widget KkiaPay impossible:", err);
      openToast("error", "Impossible d'ouvrir le module de paiement");
    } finally {
      // Le widget est ouvert (ou a échoué) : le bouton redevient disponible
      // tant que le paiement n'a pas été effectué dans le widget.
      setKkiapayStatus("idle");
    }
  };

  // 💳 Vérification KkiaPay. L'appel API est séparé du nettoyage qui suit :
  // une exception APRÈS un succès serveur n'affiche plus de toast d'erreur.
  const verifyKkiapayPayment = async (transactionId, attemptReference) => {
    if (!attemptReference) {
      openToast(
        "error",
        "Référence de paiement introuvable. Votre paiement sera vérifié par le serveur.",
      );
      return;
    }

    const txKey = String(transactionId);
    if (processedTransactionsRef.current.has(txKey)) return;
    processedTransactionsRef.current.add(txKey);

    // ⏳ Phase 2 : le serveur vérifie le paiement auprès de KkiaPay
    setKkiapayStatus("verifying");

    let res;
    try {
      res = await postData("/api/payment/verify-kkiapay", {
        transactionId,
        attemptReference,
      });
    } catch (err) {
      processedTransactionsRef.current.delete(txKey);
      setKkiapayStatus("idle");
      console.error("verify-kkiapay a échoué:", err);
      openToast("error", "Erreur serveur lors de la vérification du paiement");
      return;
    }

    if (!res?.success) {
      processedTransactionsRef.current.delete(txKey);
      setKkiapayStatus("idle");
      openToast(
        "error",
        res?.message || "Erreur lors de la confirmation du paiement",
      );
      return;
    }

    // Succès : on garde le chargement affiché jusqu'à la redirection
    openToast("success", "Paiement confirmé, commande créée avec succès !");
    setCartItems([]);
    setTotals({ subTotalAmt: 0, shippingAmt: 0, taxAmt: 0, totalAmt: 0 });
    trackPurchase(res.data); // confirmed: true (paiement en ligne)
    navigate("/order/success", { state: { order: res.data } });
  };

  const [loadingCod, setLoadingCod] = useState(false);

  const handlePayCashOnDelivery = async () => {
    if (!paymentMethods.cashOnDelivery) {
      openToast(
        "error",
        "Le paiement à la livraison n'est pas disponible sur cette boutique",
      );
      return;
    }
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
        // ✅ MODIFIÉ : confirmed: false — l'argent n'est pas encore encaissé,
        // le serveur confirmera l'event automatiquement quand la commande
        // sera marquée "Livrée" côté admin.
        trackPurchase(res.data, false);
        setCartItems([]);
        setTotals({ subTotalAmt: 0, shippingAmt: 0, taxAmt: 0, totalAmt: 0 });
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

  if (loading || !user?._id) {
    return null;
  }

  return (
    <div className="co-page">
      <div className="co-container">
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

        <div className="co-order-summary">
          <h2>Votre commande</h2>

          <div className="co-order-items">
            {cartItems.length === 0 ? (
              <p className="co-empty-order">Votre panier est vide.</p>
            ) : (
              cartItems.map((item) => {
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

          {totals.subTotalAmt > 0 && (
            <div className="co-total-row">
              <span>Sous-total</span>
              <span>{totals.subTotalAmt.toLocaleString()} FCFA</span>
            </div>
          )}
          {totals.shippingAmt > 0 && (
            <div className="co-total-row">
              <span>Expédition</span>
              <span>{totals.shippingAmt.toLocaleString()} FCFA</span>
            </div>
          )}
          {totals.taxAmt > 0 && (
            <div className="co-total-row">
              <span>Taxes</span>
              <span>{totals.taxAmt.toLocaleString()} FCFA</span>
            </div>
          )}
          <div className="co-total-row co-grand-total">
            <span>Total</span>
            <span>{totals.totalAmt.toLocaleString()} FCFA</span>
          </div>

          <div className="co-payment-methods">
            {paymentMethods.fedapay && (
              <button
                className="co-btn-pay"
                onClick={handlePay}
                disabled={kkiapayBusy}
              >
                Payer avec FedaPay
              </button>
            )}
            {paymentMethods.kkiapay && (
              <button
                className="co-btn-pay co-btn-pay-kkiapay"
                onClick={handlePayKkiapay}
                disabled={kkiapayBusy}
              >
                {kkiapayStatus === "preparing" && <CircularProgress />}
                {kkiapayStatus === "verifying" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                    }}
                  >
                    <CircularProgress />
                    Vérification du paiement…
                  </span>
                )}
                {kkiapayStatus === "idle" && "Payer avec KkiaPay"}
              </button>
            )}
            {paymentMethods.cashOnDelivery && (
              <button
                className="co-btn-pay co-btn-pay-cod"
                onClick={handlePayCashOnDelivery}
                disabled={loadingCod || kkiapayBusy}
              >
                {loadingCod ? "Traitement..." : "Payer à la livraison"}
              </button>
            )}
            {!paymentMethods.fedapay &&
              !paymentMethods.kkiapay &&
              !paymentMethods.cashOnDelivery && (
                <p className="co-no-payment">
                  Aucun moyen de paiement n&apos;est disponible pour le moment.
                  Contactez le vendeur.
                </p>
              )}
          </div>
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