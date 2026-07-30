import React, { useRef, useState, useEffect } from "react";
import {
  MdArrowBackIos,
  MdArrowForwardIos,
  MdTrendingUp,
  MdTrendingDown,
} from "react-icons/md";
import { FaUsers, FaShoppingCart, FaDollarSign, FaBox, FaTags } from "react-icons/fa";
import CircularProgress from "../CircularProgress/CircularProgress";
import "./dashboardboxes.scss";
import { fetchDataFromApi } from "../../pages/utils/api";

// Titre + icône par carte. La valeur et la tendance viennent de l'API.
const STAT_META = [
  { key: "users", title: "Utilisateurs", icon: <FaUsers /> },
  { key: "orders", title: "Commandes", icon: <FaShoppingCart /> },
  { key: "revenue", title: "Revenus", icon: <FaDollarSign /> },
  { key: "products", title: "Produits", icon: <FaBox /> },
  { key: "categories", title: "Catégories", icon: <FaTags /> },
];

const formatValue = (key, value) => {
  if (key === "revenue") {
    return `${(value || 0).toLocaleString()} FCFA`;
  }
  return (value || 0).toLocaleString();
};

const DashboardBoxe = () => {
  const sliderRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDataFromApi("/api/dashboard/stats")
      .then((res) => {
        if (res?.success) {
          setStats(res.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction) => {
    const slider = sliderRef.current;
    const offset = direction === "left" ? -250 : 250;
    slider.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="dashboard-boxe loading">
        <CircularProgress />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="dashboard-boxe">
        <p>Impossible de charger les statistiques.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-boxe">
      <button className="nav-btn left" onClick={() => scroll("left")}>
        <MdArrowBackIos />
      </button>

      <div className="slider" ref={sliderRef}>
        {STAT_META.map(({ key, title, icon }) => {
          const stat = stats[key];
          if (!stat) return null;

          return (
            <div key={key} className="stat-box">
              <div className="top-section">
                <div className="left-part">
                  <div className="icon">{icon}</div>
                  <div className="info">
                    <h3>{title}</h3>
                    <p>{formatValue(key, stat.value)}</p>
                  </div>
                </div>
                <div className="right-part">
                  {/* Petit graphique simulé (tu peux mettre un vrai mini chart plus tard) */}
                  <div className="mini-graph">
                    <div className="bar bar1"></div>
                    <div className="bar bar2"></div>
                    <div className="bar bar3"></div>
                    <div className="bar bar4"></div>
                    <div className="bar bar5"></div>
                  </div>
                </div>
              </div>

              <hr />

              <div className="bottom-section">
                {stat.trend === "up" ? (
                  <MdTrendingUp className="trend-icon up" />
                ) : (
                  <MdTrendingDown className="trend-icon down" />
                )}
                <span className={`percent ${stat.trend === "up" ? "up" : "down"}`}>
                  {stat.percent}
                </span>
                <span className="desc">
                  {stat.trend === "up" ? "augmenté" : "diminué"} cette semaine
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="nav-btn right" onClick={() => scroll("right")}>
        <MdArrowForwardIos />
      </button>
    </div>
  );
};

export default DashboardBoxe;