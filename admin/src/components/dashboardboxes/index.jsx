import React, { useRef } from "react";
import {
  MdArrowBackIos,
  MdArrowForwardIos,
  MdTrendingUp,
  MdTrendingDown,
} from "react-icons/md";
import {
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
  FaBox,
  FaChartLine,
} from "react-icons/fa";
import "./dashboardboxes.scss";

const stats = [
  {
    title: "Utilisateurs",
    value: 1200,
    icon: <FaUsers />,
    trend: "up",
    percent: "+8.4%",
    desc: "augmenté le mois dernier",
  },
  {
    title: "Commandes",
    value: 540,
    icon: <FaShoppingCart />,
    trend: "down",
    percent: "-2.3%",
    desc: "diminué le mois dernier",
  },
  {
    title: "Revenus",
    value: "$12,400",
    icon: <FaDollarSign />,
    trend: "up",
    percent: "+12.1%",
    desc: "augmenté le mois dernier",
  },
  {
    title: "Produits",
    value: 78,
    icon: <FaBox />,
    trend: "up",
    percent: "+3.6%",
    desc: "augmenté le mois dernier",
  },
  {
    title: "Visites",
    value: 3200,
    icon: <FaChartLine />,
    trend: "down",
    percent: "-1.8%",
    desc: "diminué le mois dernier",
  },
];

const DashboardBoxe = () => {
  const sliderRef = useRef(null);

  const scroll = (direction) => {
    const slider = sliderRef.current;
    const offset = direction === "left" ? -250 : 250;
    slider.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="dashboard-boxe">
      <button className="nav-btn left" onClick={() => scroll("left")}>
        <MdArrowBackIos />
      </button>

      <div className="slider" ref={sliderRef}>
        {stats.map((stat, index) => (
          <div key={index} className="stat-box">
            <div className="top-section">
              <div className="left-part">
                <div className="icon">{stat.icon}</div>
                <div className="info">
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
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
              <span
                className={`percent ${
                  stat.trend === "up" ? "up" : "down"
                }`}
              >
                {stat.percent}
              </span>
              <span className="desc">{stat.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="nav-btn right" onClick={() => scroll("right")}>
        <MdArrowForwardIos />
      </button>
    </div>
  );
};

export default DashboardBoxe;
