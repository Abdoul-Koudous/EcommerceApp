import React, { useContext, useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane, FaSyncAlt } from "react-icons/fa";
import { ToastContext } from "../../context/ToastContext";
import { editData, fetchDataFromApi, postData } from "../utils/api";
import "./supportinbox.scss";

const formatDate = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const SupportInbox = () => {
  const { openToast } = useContext(ToastContext);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("open");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const selectedIdRef = useRef(null);
  const pollingRef = useRef(false);
  const [syncStatus, setSyncStatus] = useState("Actualisation automatique active");

  const loadConversations = async () => {
    setLoading(true);
    const response = await fetchDataFromApi(
      `/api/support-conversations/admin?status=${filter}`,
    );
    if (response?.success) {
      setConversations(response.data || []);
    } else {
      openToast("error", response?.message || "Impossible de charger la boîte support");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
    // loadConversations follows the selected filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    const pollConversations = async () => {
      if (document.visibilityState !== "visible" || pollingRef.current) return;
      pollingRef.current = true;

      try {
        const listResponse = await fetchDataFromApi(
          `/api/support-conversations/admin?status=${filter}`,
        );
        if (!listResponse?.success) {
          setSyncStatus("Actualisation interrompue — nouvelle tentative automatique");
          return;
        }
        setConversations(listResponse.data || []);

        const selectedId = selectedIdRef.current;
        if (selectedId) {
          const detailResponse = await fetchDataFromApi(
            `/api/support-conversations/admin/${selectedId}?markRead=false`,
          );
          if (detailResponse?.success) {
            setSelected((current) =>
              current?._id === selectedId ? detailResponse.data : current,
            );
          } else if (detailResponse?.error) {
            setSyncStatus("Actualisation interrompue — nouvelle tentative automatique");
            return;
          }
        }

        setSyncStatus(
          `Mis à jour à ${new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}`,
        );
      } finally {
        pollingRef.current = false;
      }
    };

    const intervalId = window.setInterval(pollConversations, 4000);
    return () => window.clearInterval(intervalId);
  }, [filter]);

  const openConversation = async (id) => {
    const response = await fetchDataFromApi(
      `/api/support-conversations/admin/${id}`,
    );
    if (!response?.success) {
      openToast("error", response?.message || "Impossible d'ouvrir la conversation");
      return;
    }
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    await loadConversations();
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    const response = await postData(
      `/api/support-conversations/admin/${selected._id}/messages`,
      { message: reply },
    );
    setSending(false);
    if (!response?.success) {
      openToast("error", response?.message || "Impossible d'envoyer la réponse");
      return;
    }
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    setReply("");
    await loadConversations();
  };

  const updateStatus = async () => {
    if (!selected) return;
    const nextStatus = selected.status === "open" ? "closed" : "open";
    const response = await editData(
      `/api/support-conversations/admin/${selected._id}/status`,
      { status: nextStatus },
    );
    if (!response?.success) {
      openToast("error", response?.message || "Impossible de modifier le statut");
      return;
    }
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    await loadConversations();
  };

  return (
    <section className="support-inbox">
      <header className="support-inbox__header">
        <div>
          <h2>Conversations du service client</h2>
          <p>{syncStatus}. Les nouveaux messages apparaissent automatiquement.</p>
        </div>
        <button
          type="button"
          className="support-inbox__refresh"
          onClick={loadConversations}
          disabled={loading}
        >
          <FaSyncAlt /> Actualiser
        </button>
      </header>

      <div className="support-inbox__filters" role="group" aria-label="Filtrer les conversations">
        {[
          ["open", "Ouvertes"],
          ["closed", "Clôturées"],
          ["all", "Toutes"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={filter === value ? "is-active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="support-inbox__layout">
        <aside className="support-inbox__list" aria-label="Liste des conversations">
          {loading ? (
            <p className="support-inbox__empty">Chargement…</p>
          ) : conversations.length === 0 ? (
            <p className="support-inbox__empty">Aucune conversation pour le moment.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                type="button"
                key={conversation._id}
                className={`support-inbox__item ${
                  selected?._id === conversation._id ? "is-selected" : ""
                }`}
                onClick={() => openConversation(conversation._id)}
              >
                <span className="support-inbox__item-top">
                  <strong>{conversation.userId?.name || "Client"}</strong>
                  <time>{formatDate(conversation.lastMessageAt)}</time>
                </span>
                <span className="support-inbox__subject">{conversation.subject}</span>
                <span className="support-inbox__preview">
                  {conversation.lastMessagePreview}
                </span>
                <span className="support-inbox__item-bottom">
                  {conversation.orderId
                    ? `Commande ${conversation.orderId}`
                    : "Assistance générale"}
                  {conversation.unreadByAdmin > 0 && (
                    <span className="support-inbox__unread">
                      {conversation.unreadByAdmin}
                    </span>
                  )}
                </span>
              </button>
            ))
          )}
        </aside>

        <div className="support-inbox__panel">
          {selected ? (
            <>
              <div className="support-inbox__thread-header">
                <div>
                  <h3>{selected.subject}</h3>
                  <p>
                    {selected.userId?.name || "Client"} · {selected.userId?.email || ""}
                    {selected.orderId ? ` · Commande ${selected.orderId}` : ""}
                  </p>
                </div>
                <button type="button" onClick={updateStatus}>
                  {selected.status === "open" ? "Clôturer" : "Rouvrir"}
                </button>
              </div>
              <div className="support-inbox__thread">
                {selected.messages?.map((message) => (
                  <article
                    key={message._id}
                    className={`support-inbox__bubble ${
                      message.sender === "admin" ? "from-admin" : "from-customer"
                    }`}
                  >
                    <span>{message.sender === "admin" ? "Boutique" : "Client"}</span>
                    <p>{message.text}</p>
                    <time>{formatDate(message.sentAt)}</time>
                  </article>
                ))}
              </div>
              <form className="support-inbox__reply" onSubmit={sendReply}>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Écrire une réponse au client…"
                  aria-label="Réponse au client"
                  required
                />
                <button type="submit" disabled={sending || !reply.trim()}>
                  <FaPaperPlane /> {sending ? "Envoi…" : "Répondre"}
                </button>
              </form>
            </>
          ) : (
            <div className="support-inbox__welcome">
              <FaComments />
              <h3>Sélectionnez une conversation</h3>
              <p>Les clients peuvent vous écrire depuis leur espace « Service client ».</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SupportInbox;
