// 📁 Fichier à remplacer : client/src/pages/trackorder/index.jsx

import { useState } from "react";
import { fetchDataFromApi } from "../utils/api";
import "./trackorder.scss";

// Étapes du cycle de vie d'une commande — les clés correspondent
// directement aux valeurs de `order_status` côté backend (en français).
const STEPS = [
  { key: "Reçue", label: "Confirmée", icon: "check" },
  { key: "En préparation", label: "Préparation", icon: "box" },
  { key: "Expédiée", label: "Expédiée", icon: "truck" },
  { key: "Livrée", label: "Livrée", icon: "home" },
];

// Texte générique par statut, affiché dans l'historique (le backend ne
// stocke que le statut + la date, pas de note libre par étape).
const STATUS_NOTES = {
  "Reçue": "Commande reçue et confirmée.",
  "En préparation": "Commande en cours de préparation.",
  "Expédiée": "Commande expédiée.",
  "Livrée": "Commande livrée.",
  "Annulée": "Commande annulée.",
};

async function fetchOrderStatus(orderNumber) {
  const res = await fetchDataFromApi(
    `/api/order/track/${encodeURIComponent(orderNumber.trim())}`
  );

  if (!res?.success) return null;
  return res.data;
}

function formatAddress(addr) {
  if (!addr) return "";

  return [addr.address_line1, addr.landmark, addr.city, addr.pincode, addr.country]
    .filter(Boolean)
    .join(", ");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amt) {
  return new Intl.NumberFormat("fr-FR").format(amt || 0) + " FCFA";
}

function IconFor({ name }) {
  const paths = {
    check: <path d="M20 6 9 17l-5-5" />,
    box: (
      <>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    truck: (
      <>
        <path d="M1 3h13v13H1z" />
        <path d="M14 8h4l3 3v5h-7V8Z" />
        <circle cx="5.5" cy="18.5" r="1.5" />
        <circle cx="17.5" cy="18.5" r="1.5" />
      </>
    ),
    home: <path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | found | notfound
  const [order, setOrder] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    const result = await fetchOrderStatus(orderNumber);

    if (result) {
      setOrder(result);
      setStatus("found");
    } else {
      setOrder(null);
      setStatus("notfound");
    }
  }

  const isCancelled = order?.order_status === "Annulée";
  const currentIndex = order
    ? STEPS.findIndex((s) => s.key === order.order_status)
    : -1;

  const items = order?.products?.map((p) => ({
    name: p.productTitle,
    qty: p.quantity,
    image: p.image,
  })) || [];

  const history = order?.statusHistory
    ? [...order.statusHistory].reverse()
    : [];

  return (
    <div className="track-page">
      <section className="track-hero">
        <span className="seal-tag seal-tag--light">
          <span className="seal-tag__dot" />
          Suivi de commande
        </span>
        <h1>Où en est votre colis ?</h1>
        <p>
          Renseignez votre numéro de commande pour suivre sa progression en
          temps réel.
        </p>

        <form className="track-form" onSubmit={handleSubmit}>
          <div className="track-form__field">
            <label htmlFor="orderNumber">Numéro de commande</label>
            <input
              id="orderNumber"
              type="text"
              placeholder="Ex. CMD-284910"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Recherche…" : "Suivre ma commande"}
          </button>
        </form>
      </section>

      <div className="track-page__container">
        {status === "notfound" && (
          <div className="track-empty">
            <h3>Aucune commande trouvée</h3>
            <p>
              Vérifiez le numéro de commande saisi, ou{" "}
              <a href="/centre-aide">contactez le service client</a>.
            </p>
          </div>
        )}

        {status === "found" && order && (
          <>
            <div className="track-summary">
              <div>
                <p className="track-summary__label">Commande</p>
                <p className="track-summary__value">{order.orderId}</p>
              </div>
              <div>
                <p className="track-summary__label">Statut</p>
                <p className="track-summary__value">{order.order_status}</p>
              </div>
              <div>
                <p className="track-summary__label">Total</p>
                <p className="track-summary__value">{formatAmount(order.totalAmt)}</p>
              </div>
              <div>
                <p className="track-summary__label">Adresse</p>
                <p className="track-summary__value">
                  {formatAddress(order.delivery_address)}
                </p>
              </div>
            </div>

            {isCancelled ? (
              <div className="track-empty track-empty--error">
                <h3>Commande annulée</h3>
                <p>Cette commande a été annulée.</p>
              </div>
            ) : (
              <ol className="track-stepper">
                {STEPS.map((step, i) => {
                  const state =
                    i < currentIndex
                      ? "done"
                      : i === currentIndex
                      ? "active"
                      : "upcoming";
                  return (
                    <li key={step.key} className={`track-stepper__step track-stepper__step--${state}`}>
                      <span className="track-stepper__icon">
                        <IconFor name={step.icon} />
                      </span>
                      <span className="track-stepper__label">{step.label}</span>
                      {i < STEPS.length - 1 && <span className="track-stepper__line" />}
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Historique */}
            {history.length > 0 && (
              <section className="track-history">
                <h3>Historique</h3>
                <ul>
                  {history.map((h, i) => (
                    <li key={i}>
                      <span className="track-history__dot" />
                      <div>
                        <p className="track-history__note">
                          {STATUS_NOTES[h.status] || h.status}
                        </p>
                        <p className="track-history__date">{formatDate(h.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Articles */}
            {items.length > 0 && (
              <section className="track-items">
                <h3>Articles de la commande</h3>
                <ul>
                  {items.map((item, i) => (
                    <li key={i}>
                      <img src={item.image} alt="" />
                      <div>
                        <p>{item.name}</p>
                        <span>Qté {item.qty}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {status === "idle" && (
          <div className="track-help-hint">
            <p>
              Besoin d'aide pour retrouver votre numéro de commande ? Il figure
              dans l'e-mail de confirmation, ou dans{" "}
              <a href="/account/orders">votre historique de commandes</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}