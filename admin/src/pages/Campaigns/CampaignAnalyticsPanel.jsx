// admin/src/pages/Campaigns/CampaignAnalyticsPanel.jsx
import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { fetchDataFromApi } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import "./campaignAnalyticsPanel.scss";

const CHANNEL_LABELS = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  direct: "Direct (sans canal)",
};

const CampaignAnalyticsPanel = ({ campaign, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    if (!campaign) return;

    setLoading(true);
    fetchDataFromApi(`/api/campaign/analytics/${campaign._id}`).then((res) => {
      if (res?.success) {
        setChannels(res.channels || []);
      }
      setLoading(false);
    });
  }, [campaign]);

  if (!campaign) return null;

  const bestChannel = channels.reduce(
    (best, c) => (c.revenue > (best?.revenue || 0) ? c : best),
    null,
  );

  return (
    <>
      <div className="cap-overlay" onClick={onClose} />
      <div className="cap-panel">
        <div className="cap-header">
          <div>
            <h3>Performances — {campaign.name}</h3>
            <span className="cap-subtitle">
              Parcours complet des visiteurs, par canal
            </span>
          </div>
          <button className="cap-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="cap-body">
          {loading ? (
            <div className="cap-loading">
              <CircularProgress />
            </div>
          ) : channels.length === 0 ? (
            <p className="cap-empty">
              Aucune donnée pour le moment — partagez vos liens pour
              commencer à collecter des statistiques.
            </p>
          ) : (
            <>
              {bestChannel && bestChannel.revenue > 0 && (
                <div className="cap-best-channel">
                  🏆 Meilleur canal :{" "}
                  <strong>
                    {CHANNEL_LABELS[bestChannel.channel] || bestChannel.channel}
                  </strong>{" "}
                  — {bestChannel.revenue.toLocaleString()} FCFA généré(s)
                </div>
              )}

              <div className="cap-funnel-table">
                <div className="cap-funnel-header">
                  <span>Canal</span>
                  <span>Visites</span>
                  <span>Vues produit</span>
                  <span>Paniers</span>
                  <span>Achats</span>
                  <span>Conversion</span>
                  <span>CA</span>
                </div>

                {channels.map((c) => (
                  <div className="cap-funnel-row" key={c.channel}>
                    <span
                      className={`cap-channel-badge cap-${c.channel}`}
                    >
                      {CHANNEL_LABELS[c.channel] || c.channel}
                    </span>
                    <span>{c.visits}</span>
                    <span>{c.productViews}</span>
                    <span>{c.addToCart}</span>
                    <span>{c.purchases}</span>
                    <span className="cap-conversion">
                      {c.conversionRate}%
                    </span>
                    <span className="cap-revenue">
                      {c.revenue.toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>

              {/* Visualisation simple du funnel, canal par canal */}
              <div className="cap-funnel-bars">
                {channels.map((c) => {
                  const maxVisits = Math.max(...channels.map((x) => x.visits), 1);
                  return (
                    <div className="cap-funnel-bar-group" key={c.channel}>
                      <span className="cap-funnel-bar-label">
                        {CHANNEL_LABELS[c.channel] || c.channel}
                      </span>
                      <div className="cap-funnel-bar-track">
                        <div
                          className={`cap-funnel-bar cap-${c.channel}`}
                          style={{
                            width: `${(c.visits / maxVisits) * 100}%`,
                          }}
                        >
                          {c.visits}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CampaignAnalyticsPanel;