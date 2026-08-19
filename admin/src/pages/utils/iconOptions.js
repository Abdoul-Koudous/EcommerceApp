import {
  FaShippingFast,
  FaHeadset,
  FaShieldAlt,
  FaMedal,
  FaTruck,
  FaGem,
  FaHandsHelping,
  FaClock,
  FaLock,
  FaThumbsUp,
  FaStar,
  FaGift,
  FaHeart,
  FaCheckCircle,
  FaUsers,
  FaAward,
  FaBoxOpen,
  FaCreditCard,
  FaGlobe,
  FaLeaf,
  FaMoneyBillWave,
  FaRecycle,
  FaSmile,
  FaTags,
} from "react-icons/fa";

// ✅ Chaque entrée = { name: "nom stocké en base", label: "libellé lisible", Icon: composant }
export const iconOptions = [
  { name: "FaShippingFast", label: "Livraison rapide", Icon: FaShippingFast },
  { name: "FaTruck", label: "Camion / Transport", Icon: FaTruck },
  { name: "FaHeadset", label: "Support / Casque", Icon: FaHeadset },
  { name: "FaShieldAlt", label: "Sécurité / Bouclier", Icon: FaShieldAlt },
  { name: "FaLock", label: "Cadenas / Confidentialité", Icon: FaLock },
  { name: "FaMedal", label: "Médaille / Qualité", Icon: FaMedal },
  { name: "FaAward", label: "Récompense", Icon: FaAward },
  { name: "FaGem", label: "Diamant / Premium", Icon: FaGem },
  { name: "FaHandsHelping", label: "Entraide / Assistance", Icon: FaHandsHelping },
  { name: "FaClock", label: "Horloge / Rapidité", Icon: FaClock },
  { name: "FaThumbsUp", label: "Pouce levé / Satisfaction", Icon: FaThumbsUp },
  { name: "FaStar", label: "Étoile / Avis", Icon: FaStar },
  { name: "FaGift", label: "Cadeau / Offre", Icon: FaGift },
  { name: "FaHeart", label: "Cœur / Favoris", Icon: FaHeart },
  { name: "FaCheckCircle", label: "Coche / Validé", Icon: FaCheckCircle },
  { name: "FaUsers", label: "Communauté / Clients", Icon: FaUsers },
  { name: "FaBoxOpen", label: "Colis / Produit", Icon: FaBoxOpen },
  { name: "FaCreditCard", label: "Carte / Paiement", Icon: FaCreditCard },
  { name: "FaGlobe", label: "Monde / International", Icon: FaGlobe },
  { name: "FaLeaf", label: "Feuille / Écologie", Icon: FaLeaf },
  { name: "FaMoneyBillWave", label: "Argent / Prix", Icon: FaMoneyBillWave },
  { name: "FaRecycle", label: "Recyclage / Durable", Icon: FaRecycle },
  { name: "FaSmile", label: "Sourire / Satisfaction", Icon: FaSmile },
  { name: "FaTags", label: "Étiquette / Promo", Icon: FaTags },
];

export const getIconComponent = (name) => {
  const found = iconOptions.find((opt) => opt.name === name);
  return found ? found.Icon : FaStar;
};