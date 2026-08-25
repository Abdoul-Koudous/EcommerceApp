import React, { useEffect, useState } from "react";
import { FaChartLine, FaTrophy, FaBoxOpen, FaBullhorn } from "react-icons/fa";
import { fetchDataFromApi } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import "./analytics.scss";

const CHANNEL_LABELS = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  direct: "Direct (sans canal)",
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDataFromApi("/api/campaign/analytics-overview").then((res) => {
      if (res?.success) {
        setData(res);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="an-page">
        <div className="an-loading">
          <CircularProgress />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="an-page">
        <p className="an-empty">Impossible de charger les statistiques.</p>
      </div>
    );
  }

  const { totals, channels, topProducts, topCampaigns } = data;

  const bestChannel = channels.reduce(
    (best, c) => (c.revenue > (best?.revenue || 0) ? c : best),
    null,
  );

  return (
    <div className="an-page">
      <div className="an-header">
        <h2>Performance commerciale</h2>
        <p>Vue d'ensemble de vos campagnes Social Commerce, tous canaux confondus.</p>
      </div>

      {/* Totaux globaux */}
      <div className="an-totals-grid">
        <div className="an-total-card">
          <span className="an-total-label">👥 Visiteurs</span>
          <span className="an-total-value">{totals.visits}</span>
        </div>
        <div className="an-total-card">
          <span className="an-total-label">🛒 Commandes</span>
          <span className="an-total-value">{totals.purchases}</span>
        </div>
        <div className="an-total-card">
          <span className="an-total-label">💰 CA généré</span>
          <span className="an-total-value">
            {totals.revenue.toLocaleString()} FCFA
          </span>
        </div>
        <div className="an-total-card">
          <span className="an-total-label">📊 Conversion</span>
          <span className="an-total-value">{totals.conversionRate}%</span>
        </div>
      </div>

      {/* Sources de trafic */}
      <div className="an-section">
        <h3>Sources de trafic</h3>

        {channels.length === 0 ? (
          <p className="an-empty">Aucune donnée pour le moment.</p>
        ) : (
          <div className="an-channels-bars">
            {channels.map((c) => {
              const maxVisits = Math.max(...channels.map((x) => x.visits), 1);
              return (
                <div className="an-channel-bar-group" key={c.channel}>
                  <span className="an-channel-bar-label">
                    {CHANNEL_LABELS[c.channel] || c.channel}
                  </span>
                  <div className="an-channel-bar-track">
                    <div
                      className={`an-channel-bar an-${c.channel}`}
                      style={{ width: `${(c.visits / maxVisits) * 100}%` }}
                    >
                      {c.visits}
                    </div>
                  </div>
                  <span className="an-channel-bar-conversion">
                    {c.conversionRate}% conversion
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="an-two-col">
        {/* Meilleur canal */}
        <div className="an-section">
          <h3>
            <FaTrophy /> Meilleur canal
          </h3>
          {bestChannel && bestChannel.revenue > 0 ? (
            <div className="an-highlight-card">
              <span
                className={`an-channel-badge an-${bestChannel.channel}`}
              >
                {CHANNEL_LABELS[bestChannel.channel] || bestChannel.channel}
              </span>
              <span className="an-highlight-value">
                {bestChannel.revenue.toLocaleString()} FCFA
              </span>
              <span className="an-highlight-sub">
                {bestChannel.purchases} commande
                {bestChannel.purchases > 1 ? "s" : ""} · {bestChannel.conversionRate}%
                de conversion
              </span>
            </div>
          ) : (
            <p className="an-empty">Pas encore de vente trackée.</p>
          )}
        </div>

        {/* Meilleure campagne */}
        <div className="an-section">
          <h3>
            <FaBullhorn /> Meilleure campagne
          </h3>
          {topCampaigns.length > 0 ? (
            <div className="an-highlight-card">
              <span className="an-highlight-title">{topCampaigns[0].name}</span>
              <span className="an-highlight-value">
                {topCampaigns[0].revenue.toLocaleString()} FCFA
              </span>
              <span className="an-highlight-sub">
                {topCampaigns[0].purchases} commande
                {topCampaigns[0].purchases > 1 ? "s" : ""}
              </span>
            </div>
          ) : (
            <p className="an-empty">Pas encore de vente trackée.</p>
          )}
        </div>
      </div>

      {/* Meilleurs produits */}
      <div className="an-section">
        <h3>
          <FaBoxOpen /> Produits les plus performants
        </h3>

        {topProducts.length === 0 ? (
          <p className="an-empty">Pas encore de vente trackée.</p>
        ) : (
          <div className="an-products-list">
            {topProducts.map((p, i) => (
              <div className="an-product-row" key={p.productId}>
                <span className="an-product-rank">#{i + 1}</span>
                <img src={p.image || "/placeholder.png"} alt={p.name} />
                <span className="an-product-name">{p.name}</span>
                <span className="an-product-purchases">
                  {p.purchases} vente{p.purchases > 1 ? "s" : ""}
                </span>
                <span className="an-product-revenue">
                  {p.revenue.toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toutes les campagnes */}
      {topCampaigns.length > 1 && (
        <div className="an-section">
          <h3>Campagnes les plus performantes</h3>
          <div className="an-campaigns-list">
            {topCampaigns.map((c, i) => (
              <div className="an-campaign-row" key={c.campaignId}>
                <span className="an-product-rank">#{i + 1}</span>
                <span className="an-product-name">{c.name}</span>
                <span className="an-product-purchases">
                  {c.purchases} commande{c.purchases > 1 ? "s" : ""}
                </span>
                <span className="an-product-revenue">
                  {c.revenue.toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;