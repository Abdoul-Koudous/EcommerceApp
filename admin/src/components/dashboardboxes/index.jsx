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
      <div className="dsb-wrapper dsb-loading">
        <CircularProgress />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="dsb-wrapper">
        <p>Impossible de charger les statistiques.</p>
      </div>
    );
  }

  return (
    <div className="dsb-wrapper">
      <button className="dsb-nav-btn dsb-nav-left" onClick={() => scroll("left")}>
        <MdArrowBackIos />
      </button>

      <div className="dsb-slider" ref={sliderRef}>
        {STAT_META.map(({ key, title, icon }) => {
          const stat = stats[key];
          if (!stat) return null;

          return (
            <div key={key} className="dsb-stat-box">
              <div className="dsb-top">
                <div className="dsb-left">
                  <div className="dsb-icon">{icon}</div>
                  <div className="dsb-info">
                    <h3>{title}</h3>
                    <p>{formatValue(key, stat.value)}</p>
                  </div>
                </div>
                <div className="dsb-right">
                  <div className="dsb-mini-graph">
                    <div className="dsb-bar dsb-bar-1"></div>
                    <div className="dsb-bar dsb-bar-2"></div>
                    <div className="dsb-bar dsb-bar-3"></div>
                    <div className="dsb-bar dsb-bar-4"></div>
                    <div className="dsb-bar dsb-bar-5"></div>
                  </div>
                </div>
              </div>

              <hr />

              <div className="dsb-bottom">
                {stat.trend === "up" ? (
                  <MdTrendingUp className="dsb-trend-icon up" />
                ) : (
                  <MdTrendingDown className="dsb-trend-icon down" />
                )}
                <span className={`dsb-percent ${stat.trend === "up" ? "up" : "down"}`}>
                  {stat.percent}
                </span>
                <span className="dsb-desc">
                  {stat.trend === "up" ? "augmenté" : "diminué"} cette semaine
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="dsb-nav-btn dsb-nav-right" onClick={() => scroll("right")}>
        <MdArrowForwardIos />
      </button>
    </div>
  );
};

export default DashboardBoxe;