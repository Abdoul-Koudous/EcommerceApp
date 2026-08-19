import {
  FaShippingFast,
  FaTruck,
  FaHeadset,
  FaShieldAlt,
  FaLock,
  FaMedal,
  FaAward,
  FaGem,
  FaHandsHelping,
  FaClock,
  FaThumbsUp,
  FaStar,
  FaGift,
  FaHeart,
  FaCheckCircle,
  FaUsers,
  FaBoxOpen,
  FaCreditCard,
  FaGlobe,
  FaLeaf,
  FaMoneyBillWave,
  FaRecycle,
  FaSmile,
  FaTags,
} from "react-icons/fa";

// ✅ Ajoute ici toute icône que l'admin pourrait choisir (garde en synchro avec admin/src/utils/iconOptions.js)
export const iconMap = {
  FaShippingFast,
  FaTruck,
  FaHeadset,
  FaShieldAlt,
  FaLock,
  FaMedal,
  FaAward,
  FaGem,
  FaHandsHelping,
  FaClock,
  FaThumbsUp,
  FaStar,
  FaGift,
  FaHeart,
  FaCheckCircle,
  FaUsers,
  FaBoxOpen,
  FaCreditCard,
  FaGlobe,
  FaLeaf,
  FaMoneyBillWave,
  FaRecycle,
  FaSmile,
  FaTags,
};

// ✅ Retourne le composant correspondant, ou une icône par défaut si le nom est inconnu/vide
export const getIconComponent = (iconName) => {
  return iconMap[iconName] || FaStar;
};