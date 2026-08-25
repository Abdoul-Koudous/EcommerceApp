import React, { useContext, useEffect, useState } from "react";
import {
  FaCopy,
  FaPlus,
  FaTimes,
  FaChartLine,
  FaMagic,
  FaEdit,
  FaCheck,
} from "react-icons/fa";
import { fetchDataFromApi, postData, editData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import "./campaigns.scss";
import CampaignAnalyticsPanel from "./CampaignAnalyticsPanel";

const CHANNEL_LABELS = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

const CHANNEL_OPTIONS = Object.keys(CHANNEL_LABELS);

const OBJECTIVE_OPTIONS = [
  { value: "new", label: "🆕 Nouveau produit" },
  { value: "promo", label: "🔥 Promotion" },
  { value: "low_stock", label: "📦 Stock limité" },
  { value: "premium", label: "💎 Produit premium" },
];

const SHORTLINK_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Campaigns = () => {
  const { openToast } = useContext(ToastContext);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [creating, setCreating] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [analyticsCampaign, setAnalyticsCampaign] = useState(null);

  // ✅ NOUVEAU : état de génération de contenu, par campagne
  // { [campaignId]: { objective, loading, contentByProductId: { [productId]: {whatsapp, instagram, ...} } } }
  const [contentState, setContentState] = useState({});
  const [editingField, setEditingField] = useState(null); // `${campaignId}-${productId}-${channel}`
  const [editingValue, setEditingValue] = useState("");

  const loadCampaigns = async () => {
    setLoading(true);
    const res = await fetchDataFromApi("/api/campaign/getAll");

    if (!res?.success) {
      openToast("error", res?.message || "Erreur de chargement des campagnes");
      setLoading(false);
      return;
    }

    const loadedCampaigns = res.campaigns || [];
    setCampaigns(loadedCampaigns);

    // ✅ NOUVEAU : recharge le contenu déjà généré (persisté en base) pour
    // chaque produit de chaque campagne, sinon il "disparaît" visuellement
    // à chaque rafraîchissement alors qu'il existe bien côté serveur.
    const newContentState = {};

    for (const campaign of loadedCampaigns) {
      const contentByProductId = {};

      for (const product of campaign.products) {
        const contentRes = await fetchDataFromApi(
          `/api/social-content/product/${product._id}`,
        );

        if (contentRes?.success && contentRes.contents?.length > 0) {
          // On prend le contenu le plus récent (déjà trié par updatedAt
          // décroissant côté serveur) — un seul bloc affiché par produit,
          // celui du dernier objectif utilisé.
          contentByProductId[product._id] = contentRes.contents[0];
        }
      }

      if (Object.keys(contentByProductId).length > 0) {
        newContentState[campaign._id] = {
          objective:
            contentByProductId[Object.keys(contentByProductId)[0]]?.objective,
          contentByProductId,
        };
      }
    }

    setContentState((prev) => ({ ...newContentState, ...prev }));
    setLoading(false);
  };
  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetchDataFromApi(
        `/api/product?search=${encodeURIComponent(productSearch)}&perPage=8`,
      ).then((res) => {
        if (res?.success) {
          setProductResults(res.products || []);
        }
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [productSearch]);

  const toggleChannel = (channel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const addProduct = (product) => {
    if (selectedProducts.find((p) => p._id === product._id)) return;
    setSelectedProducts((prev) => [...prev, product]);
    setProductSearch("");
    setProductResults([]);
  };

  const removeProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  const resetForm = () => {
    setCampaignName("");
    setSelectedChannels([]);
    setSelectedProducts([]);
    setProductSearch("");
    setProductResults([]);
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      openToast("error", "Le nom de la campagne est requis");
      return;
    }
    if (selectedProducts.length === 0) {
      openToast("error", "Sélectionnez au moins un produit");
      return;
    }
    if (selectedChannels.length === 0) {
      openToast("error", "Sélectionnez au moins un canal");
      return;
    }

    setCreating(true);

    try {
      const res = await postData("/api/campaign/create", {
        name: campaignName.trim(),
        products: selectedProducts.map((p) => p._id),
        channels: selectedChannels,
      });

      if (res?.success) {
        openToast(
          "success",
          `Campagne créée avec ${res.links?.length || 0} lien(s)`,
        );
        resetForm();
        setShowCreatePanel(false);
        loadCampaigns();
      } else {
        openToast("error", res?.message || "Erreur lors de la création");
      }
    } catch (err) {
      openToast("error", "Erreur serveur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (slug) => {
    const url = `${SHORTLINK_BASE}/go/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      openToast("success", "Lien copié !");
    });
  };

  // ✅ NOUVEAU : gestion du texte généré par canal
  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      openToast("success", "Texte copié !");
    });
  };

  const setCampaignObjective = (campaignId, objective) => {
    setContentState((prev) => ({
      ...prev,
      [campaignId]: {
        ...(prev[campaignId] || {}),
        objective,
      },
    }));
  };

  // ✅ NOUVEAU : génère le contenu pour TOUS les produits de la campagne,
  // pour l'objectif sélectionné — un appel par produit.
  const handleGenerateContent = async (campaign) => {
    const objective = contentState[campaign._id]?.objective;

    if (!objective) {
      openToast("error", "Choisissez un objectif avant de générer");
      return;
    }

    setContentState((prev) => ({
      ...prev,
      [campaign._id]: { ...(prev[campaign._id] || {}), loading: true },
    }));

    try {
      const results = {};

      for (const product of campaign.products) {
        const res = await postData("/api/social-content/generate", {
          productId: product._id,
          objective,
        });

        if (res?.success) {
          results[product._id] = res.socialContent;
        }
      }

      setContentState((prev) => ({
        ...prev,
        [campaign._id]: {
          ...(prev[campaign._id] || {}),
          loading: false,
          contentByProductId: results,
        },
      }));

      openToast("success", "Contenu généré pour tous les produits");
    } catch (err) {
      openToast("error", "Erreur lors de la génération du contenu");
      setContentState((prev) => ({
        ...prev,
        [campaign._id]: { ...(prev[campaign._id] || {}), loading: false },
      }));
    }
  };

  // ✅ NOUVEAU : édition manuelle d'un texte généré avant utilisation
  const startEditing = (campaignId, productId, channel, currentText) => {
    setEditingField(`${campaignId}-${productId}-${channel}`);
    setEditingValue(currentText || "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue("");
  };

  const saveEditing = async (campaignId, productId, channel, contentId) => {
    try {
      const res = await editData(`/api/social-content/${contentId}/field`, {
        channel,
        text: editingValue,
      });

      if (res?.success) {
        setContentState((prev) => ({
          ...prev,
          [campaignId]: {
            ...prev[campaignId],
            contentByProductId: {
              ...prev[campaignId].contentByProductId,
              [productId]: res.socialContent,
            },
          },
        }));
        openToast("success", "Texte mis à jour");
      } else {
        openToast("error", res?.message || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      openToast("error", "Erreur serveur");
    } finally {
      cancelEditing();
    }
  };

  return (
    <div className="cmp-page">
      <div className="cmp-header">
        <div>
          <h2>Campagnes Social Commerce</h2>
          <p>
            Créez des liens trackés par réseau social pour vos produits, et
            générez le texte adapté à chaque canal.
          </p>
        </div>
        <button
          className="cmp-create-btn"
          onClick={() => setShowCreatePanel(true)}
        >
          <FaPlus /> Nouvelle campagne
        </button>
      </div>

      {loading ? (
        <div className="cmp-loading">
          <CircularProgress />
        </div>
      ) : campaigns.length === 0 ? (
        <p className="cmp-empty">
          Aucune campagne pour le moment. Créez-en une pour générer vos premiers
          liens trackés.
        </p>
      ) : (
        <div className="cmp-list">
          {campaigns.map((campaign) => {
            const totalClicks = campaign.links.reduce(
              (sum, l) => sum + (l.clickCount || 0),
              0,
            );

            const campaignContentState = contentState[campaign._id] || {};

            return (
              <div className="cmp-card" key={campaign._id}>
                <div className="cmp-card-header">
                  <div>
                    <h3>{campaign.name}</h3>
                    <span className="cmp-card-meta">
                      {campaign.products.length} produit
                      {campaign.products.length > 1 ? "s" : ""} ·{" "}
                      {campaign.channels.length} canal
                      {campaign.channels.length > 1 ? "aux" : ""}
                    </span>
                  </div>
                  <button
                    className="cmp-card-stat cmp-card-stat-btn"
                    onClick={() => setAnalyticsCampaign(campaign)}
                  >
                    <FaChartLine />
                    <span>
                      {totalClicks} clic{totalClicks > 1 ? "s" : ""}
                    </span>
                  </button>
                </div>

                <div className="cmp-products-preview">
                  {campaign.products.map((p) => (
                    <div className="cmp-product-chip" key={p._id}>
                      <img
                        src={p.images?.[0] || "/placeholder.png"}
                        alt={p.name}
                      />
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>

                <div className="cmp-links-table">
                  <div className="cmp-links-header">
                    <span>Produit</span>
                    <span>Canal</span>
                    <span>Clics</span>
                    <span>Lien</span>
                  </div>
                  {campaign.links.map((link) => {
                    const product = campaign.products.find(
                      (p) => p._id === link.productId,
                    );
                    return (
                      <div className="cmp-link-row" key={link._id}>
                        <span>{product?.name || "—"}</span>
                        <span
                          className={`cmp-channel-badge cmp-${link.channel}`}
                        >
                          {CHANNEL_LABELS[link.channel] || link.channel}
                        </span>
                        <span>{link.clickCount || 0}</span>
                        <button
                          className="cmp-copy-btn"
                          onClick={() => handleCopyLink(link.slug)}
                        >
                          <FaCopy /> Copier
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* ✅ NOUVEAU : bloc génération de contenu */}
                <div className="cmp-content-section">
                  <div className="cmp-content-controls">
                    <select
                      value={campaignContentState.objective || ""}
                      onChange={(e) =>
                        setCampaignObjective(campaign._id, e.target.value)
                      }
                    >
                      <option value="">Choisir un objectif...</option>
                      {OBJECTIVE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      className="cmp-generate-btn"
                      onClick={() => handleGenerateContent(campaign)}
                      disabled={campaignContentState.loading}
                    >
                      {campaignContentState.loading ? (
                        <CircularProgress size={18} />
                      ) : (
                        <>
                          <FaMagic /> Générer le contenu
                        </>
                      )}
                    </button>
                  </div>

                  {campaignContentState.contentByProductId && (
                    <div className="cmp-generated-content">
                      {campaign.products.map((product) => {
                        const content =
                          campaignContentState.contentByProductId[product._id];
                        if (!content) return null;

                        return (
                          <div
                            className="cmp-content-product"
                            key={product._id}
                          >
                            <h4>{product.name}</h4>

                            {campaign.channels.map((channel) => {
                              const fieldKey = `${campaign._id}-${product._id}-${channel}`;
                              const isEditing = editingField === fieldKey;

                              return (
                                <div
                                  className="cmp-content-channel"
                                  key={channel}
                                >
                                  <div className="cmp-content-channel-header">
                                    <span
                                      className={`cmp-channel-badge cmp-${channel}`}
                                    >
                                      {CHANNEL_LABELS[channel]}
                                    </span>
                                    <div className="cmp-content-actions">
                                      {isEditing ? (
                                        <>
                                          <button
                                            onClick={() =>
                                              saveEditing(
                                                campaign._id,
                                                product._id,
                                                channel,
                                                content._id,
                                              )
                                            }
                                          >
                                            <FaCheck />
                                          </button>
                                          <button onClick={cancelEditing}>
                                            <FaTimes />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() =>
                                              startEditing(
                                                campaign._id,
                                                product._id,
                                                channel,
                                                content[channel],
                                              )
                                            }
                                          >
                                            <FaEdit />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleCopyText(content[channel])
                                            }
                                          >
                                            <FaCopy />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {isEditing ? (
                                    <textarea
                                      value={editingValue}
                                      onChange={(e) =>
                                        setEditingValue(e.target.value)
                                      }
                                      rows={4}
                                    />
                                  ) : (
                                    <p className="cmp-content-text">
                                      {content[channel] || "Non généré"}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Panneau de création */}
      {showCreatePanel && (
        <div className="cmp-overlay" onClick={() => setShowCreatePanel(false)}>
          <div className="cmp-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cmp-panel-header">
              <h3>Nouvelle campagne</h3>
              <button onClick={() => setShowCreatePanel(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="cmp-panel-body">
              <div className="cmp-form-group">
                <label>Nom de la campagne</label>
                <input
                  type="text"
                  placeholder="Ex: Soldes Août"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="cmp-form-group">
                <label>Produits</label>
                <input
                  type="text"
                  placeholder="Rechercher un produit à ajouter..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productResults.length > 0 && (
                  <div className="cmp-search-results">
                    {productResults.map((p) => (
                      <div
                        key={p._id}
                        className="cmp-search-result-item"
                        onClick={() => addProduct(p)}
                      >
                        <img
                          src={p.images?.[0] || "/placeholder.png"}
                          alt={p.name}
                        />
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedProducts.length > 0 && (
                  <div className="cmp-selected-products">
                    {selectedProducts.map((p) => (
                      <div className="cmp-selected-product-tag" key={p._id}>
                        <img
                          src={p.images?.[0] || "/placeholder.png"}
                          alt={p.name}
                        />
                        <span>{p.name}</span>
                        <button onClick={() => removeProduct(p._id)}>
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="cmp-form-group">
                <label>Canaux</label>
                <div className="cmp-channels-grid">
                  {CHANNEL_OPTIONS.map((channel) => (
                    <button
                      type="button"
                      key={channel}
                      className={`cmp-channel-option ${selectedChannels.includes(channel) ? "active" : ""}`}
                      onClick={() => toggleChannel(channel)}
                    >
                      {CHANNEL_LABELS[channel]}
                    </button>
                  ))}
                </div>
              </div>

              {selectedProducts.length > 0 && selectedChannels.length > 0 && (
                <p className="cmp-preview-count">
                  {selectedProducts.length * selectedChannels.length} lien(s)
                  seront générés.
                </p>
              )}

              <button
                className="cmp-submit-btn"
                onClick={handleCreateCampaign}
                disabled={creating}
              >
                {creating ? <CircularProgress /> : "Créer la campagne"}
              </button>
            </div>
          </div>
        </div>
      )}

      {analyticsCampaign && (
        <CampaignAnalyticsPanel
          campaign={analyticsCampaign}
          onClose={() => setAnalyticsCampaign(null)}
        />
      )}
    </div>
  );
};

export default Campaigns;
