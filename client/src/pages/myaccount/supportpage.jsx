import React, { useContext, useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane, FaPlus, FaSyncAlt } from "react-icons/fa";
import { ToastContext } from "../../context/ToastContext";
import { fetchDataFromApi, postData } from "../utils/api";
import "./supportpage.scss";

const formatDate = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const SupportPage = () => {
  const { openToast } = useContext(ToastContext);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const messageListRef = useRef(null);
  const selectedIdRef = useRef(null);
  const pollingRef = useRef(false);
  const [syncStatus, setSyncStatus] = useState("Connexion active");

  const loadConversations = async () => {
    setLoading(true);
    const response = await fetchDataFromApi("/api/support-conversations/mine");
    if (response?.success) {
      setConversations(response.data || []);
    } else {
      openToast("error", response?.message || "Impossible de charger vos messages");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
    // loadConversations is intentionally called once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pollConversations = async () => {
      if (document.visibilityState !== "visible" || pollingRef.current) return;
      pollingRef.current = true;

      try {
        const listResponse = await fetchDataFromApi(
          "/api/support-conversations/mine",
        );
        if (!listResponse?.success) {
          setSyncStatus("Actualisation interrompue — nouvelle tentative automatique");
          return;
        }
        setConversations(listResponse.data || []);

        const selectedId = selectedIdRef.current;
        if (selectedId) {
          const detailResponse = await fetchDataFromApi(
            `/api/support-conversations/mine/${selectedId}`,
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
  }, []);

  useEffect(() => {
    if (selectedIdRef.current && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [selected?._id, selected?.messages?.length]);

  const openConversation = async (conversationId) => {
    const response = await fetchDataFromApi(
      `/api/support-conversations/mine/${conversationId}`,
    );
    if (!response?.success) {
      openToast("error", response?.message || "Impossible d'ouvrir la conversation");
      return;
    }
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    setShowNewConversation(false);
    await loadConversations();
  };

  const startConversation = async (event) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) {
      openToast("error", "Le sujet et le message sont obligatoires");
      return;
    }
    setSending(true);
    const response = await postData("/api/support-conversations/mine", {
      subject,
      message,
    });
    setSending(false);
    if (!response?.success) {
      openToast("error", response?.message || "Impossible d'envoyer votre message");
      return;
    }
    setSubject("");
    setMessage("");
    setShowNewConversation(false);
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    openToast("success", "Votre message a été envoyé au service client");
    await loadConversations();
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    const response = await postData(
      `/api/support-conversations/mine/${selected._id}/messages`,
      { message: reply },
    );
    setSending(false);
    if (!response?.success) {
      openToast("error", response?.message || "Impossible d'envoyer votre réponse");
      return;
    }
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    setReply("");
    await loadConversations();
  };

  const refreshSelected = async () => {
    if (selected) {
      await openConversation(selected._id);
    } else {
      await loadConversations();
    }
  };

  return (
    <section className="tab-content support-customer">
      <div className="support-customer__header">
        <div>
          <h2>Service client</h2>
          <p>
            Échangez avec le vendeur. {syncStatus} ; les nouveaux messages
            apparaissent automatiquement.
          </p>
        </div>
        <div className="support-customer__actions">
          <button type="button" onClick={refreshSelected} disabled={loading}>
            <FaSyncAlt /> Actualiser
          </button>
          <button
            type="button"
            className="support-customer__new"
            onClick={() => {
              setSelected(null);
              selectedIdRef.current = null;
              setShowNewConversation(true);
            }}
          >
            <FaPlus /> Nouveau message
          </button>
        </div>
      </div>

      <div className="support-customer__layout">
        <aside className="support-customer__list" aria-label="Mes conversations">
          {loading ? (
            <p className="support-customer__empty">Chargement des conversations…</p>
          ) : conversations.length === 0 ? (
            <p className="support-customer__empty">
              Vous n'avez pas encore de conversation.
            </p>
          ) : (
            conversations.map((conversation) => (
              <button
                type="button"
                key={conversation._id}
                className={`support-customer__conversation ${
                  selected?._id === conversation._id ? "is-selected" : ""
                }`}
                onClick={() => openConversation(conversation._id)}
              >
                <span className="support-customer__conversation-top">
                  <strong>{conversation.subject}</strong>
                  {conversation.unreadByCustomer > 0 && (
                    <span className="support-customer__unread">
                      {conversation.unreadByCustomer}
                    </span>
                  )}
                </span>
                <span className="support-customer__preview">
                  {conversation.lastMessagePreview}
                </span>
                <span className="support-customer__conversation-bottom">
                  {conversation.orderId
                    ? `Commande ${conversation.orderId}`
                    : "Assistance"}
                  <span>{formatDate(conversation.lastMessageAt)}</span>
                </span>
              </button>
            ))
          )}
        </aside>

        <div className="support-customer__panel">
          {showNewConversation ? (
            <form className="support-customer__new-form" onSubmit={startConversation}>
              <h3>Écrire au service client</h3>
              <label htmlFor="support-subject">Sujet</label>
              <input
                id="support-subject"
                maxLength={100}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Ex. Question sur une commande"
                required
              />
              <label htmlFor="support-message">Votre message</label>
              <textarea
                id="support-message"
                maxLength={2000}
                rows={7}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Expliquez-nous comment nous pouvons vous aider…"
                required
              />
              <button type="submit" disabled={sending}>
                <FaPaperPlane /> {sending ? "Envoi…" : "Envoyer le message"}
              </button>
            </form>
          ) : selected ? (
            <>
              <div className="support-customer__thread-header">
                <div>
                  <h3>{selected.subject}</h3>
                  {selected.orderId && <p>Commande {selected.orderId}</p>}
                </div>
                <span className={`support-customer__status status-${selected.status}`}>
                  {selected.status === "open" ? "Ouverte" : "Clôturée"}
                </span>
              </div>
              <div className="support-customer__thread" ref={messageListRef}>
                {selected.messages?.map((item) => (
                  <article
                    key={item._id}
                    className={`support-customer__bubble ${
                      item.sender === "customer" ? "from-customer" : "from-admin"
                    }`}
                  >
                    <span>{item.sender === "customer" ? "Vous" : "Boutique"}</span>
                    <p>{item.text}</p>
                    <time>{formatDate(item.sentAt)}</time>
                  </article>
                ))}
              </div>
              <form className="support-customer__reply" onSubmit={sendReply}>
                <textarea
                  rows={2}
                  maxLength={2000}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Écrire une réponse…"
                  aria-label="Votre réponse"
                  required
                />
                <button type="submit" disabled={sending || !reply.trim()}>
                  <FaPaperPlane /> {sending ? "Envoi…" : "Répondre"}
                </button>
              </form>
            </>
          ) : (
            <div className="support-customer__welcome">
              <FaComments />
              <h3>Votre espace d’échange avec la boutique</h3>
              <p>
                Choisissez une conversation ou écrivez un nouveau message. Les
                réponses apparaissent automatiquement pendant que cette page reste
                ouverte.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SupportPage;
