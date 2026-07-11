// Statut logistique (où en est la commande). Gère aussi les anciennes valeurs
// en attendant que le script de migration ait tourné sur toutes les commandes.
export const orderStatusInfo = (status) => {
  switch (status) {
    case "Livrée":
      return { label: "Livrée", className: "delivered" };
    case "Expédiée":
      return { label: "Expédiée", className: "shipped" };
    case "En préparation":
      return { label: "En préparation", className: "preparing" };
    case "Annulée":
      return { label: "Annulée", className: "cancelled" };
    case "Confirmée": // ancienne valeur
    case "Reçue":
    default:
      return { label: "Reçue", className: "received" };
  }
};

// Statut de paiement (a-t-on payé ?). Gère aussi les anciennes valeurs brutes
// des providers (approved, SUCCESS, etc.) en attendant la migration.
export const paymentStatusInfo = (status) => {
  switch (status) {
    case "Payée":
    case "approved":
    case "SUCCESS":
      return { label: "Payée", className: "paid" };
    case "Échec":
      return { label: "Échec du paiement", className: "failed" };
    case "À payer à la livraison":
    case "En attente (paiement à la livraison)":
    default:
      return { label: "À payer à la livraison", className: "cod" };
  }
};