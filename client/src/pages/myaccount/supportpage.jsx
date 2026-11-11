import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FaComments,
  FaMapMarkerAlt,
  FaPaperclip,
  FaPaperPlane,
  FaPlus,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import { ToastContext } from "../../context/ToastContext";
import { fetchDataFromApi, uploadImages } from "../utils/api";
import "./supportpage.scss";

const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const formatDate = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const MessageMedia = ({ message }) => (
  <>
    {message.text && <p>{message.text}</p>}
    {message.attachments?.length > 0 && (
      <div className="support-customer__media">
        {message.attachments.map((attachment) => (
          <a
            key={attachment.url}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="support-customer__attachment"
          >
            {attachment.type === "video" ? (
              <video src={attachment.url} controls preload="metadata">
                Votre navigateur ne prend pas en charge la lecture vidéo.
              </video>
            ) : (
              <img src={attachment.url} alt={attachment.name || "Image envoyée"} />
            )}
            <span>{attachment.name || "Ouvrir la pièce jointe"}</span>
          </a>
        ))}
      </div>
    )}
    {Number.isFinite(message.location?.latitude) &&
      Number.isFinite(message.location?.longitude) && (
      <a
        className="support-customer__location"
        href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaMapMarkerAlt />
        Voir la position partagée sur la carte
      </a>
    )}
  </>
);

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
  const [attachments, setAttachments] = useState([]);
  const [location, setLocation] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const fileInputRef = useRef(null);
  const messageListRef = useRef(null);
  const selectedIdRef = useRef(null);
  const pollingRef = useRef(false);
  const syncNotificationsRef = useRef(() => {});
  const unreadByConversationRef = useRef(new Map());
  const hasUnreadSnapshotRef = useRef(false);
  const [syncStatus, setSyncStatus] = useState("Connexion active");

  const syncConversationNotifications = (items) => {
    let newReply;
    items.forEach((conversation) => {
      const unread = conversation.unreadByCustomer || 0;
      const previous = unreadByConversationRef.current.get(conversation._id);
      if (
        hasUnreadSnapshotRef.current &&
        unread > 0 &&
        (previous === undefined || unread > previous)
      ) {
        newReply ||= conversation;
      }
      unreadByConversationRef.current.set(conversation._id, unread);
    });
    hasUnreadSnapshotRef.current = true;

    if (newReply) {
      openToast(
        "info",
        `Nouvelle réponse de la boutique dans « ${newReply.subject} »`,
      );
    }
  };
  syncNotificationsRef.current = syncConversationNotifications;

  const loadConversations = async () => {
    setLoading(true);
    const response = await fetchDataFromApi("/api/support-conversations/mine");
    if (response?.success) {
      const items = response.data || [];
      syncConversationNotifications(items);
      setConversations(items);
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
        const items = listResponse.data || [];
        syncNotificationsRef.current(items);
        setConversations(items);

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
    setReply("");
    setAttachments([]);
    setLocation(null);
    await loadConversations();
  };

  const handleAttachmentSelect = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      openToast("error", `Vous pouvez joindre ${MAX_ATTACHMENTS} fichiers maximum`);
      return;
    }
    const invalidFile = files.find(
      (file) =>
        !ACCEPTED_ATTACHMENT_TYPES.has(file.type) ||
        file.size > MAX_ATTACHMENT_SIZE,
    );
    if (invalidFile) {
      openToast(
        "error",
        "Choisissez une image ou vidéo acceptée de 15 Mo maximum",
      );
      return;
    }
    setAttachments((current) => [...current, ...files]);
  };

  const shareCurrentLocation = () => {
    if (!navigator.geolocation) {
      openToast("error", "La géolocalisation n'est pas disponible sur cet appareil");
      return;
    }

    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setSharingLocation(false);
      },
      () => {
        setSharingLocation(false);
        openToast("error", "Impossible d'obtenir votre position. Vérifiez l'autorisation du navigateur.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const createMessageFormData = (text) => {
    const formData = new FormData();
    formData.append("message", text);
    attachments.forEach((file) => formData.append("attachments", file));
    if (location) formData.append("location", JSON.stringify(location));
    return formData;
  };

  const renderComposerTools = () => (
    <>
      <div className="support-customer__composer-tools">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          multiple
          hidden
          onChange={handleAttachmentSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || attachments.length >= MAX_ATTACHMENTS}
        >
          <FaPaperclip /> Ajouter une image ou vidéo
        </button>
        <button
          type="button"
          onClick={shareCurrentLocation}
          disabled={sending || sharingLocation}
        >
          <FaMapMarkerAlt />
          {sharingLocation ? "Localisation…" : "Partager ma position"}
        </button>
      </div>
      {attachments.length > 0 && (
        <ul className="support-customer__attachment-list">
          {attachments.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}`}>
              <span>{file.name}</span>
              <button
                type="button"
                aria-label={`Retirer ${file.name}`}
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((_, fileIndex) => fileIndex !== index),
                  )
                }
              >
                <FaTimes />
              </button>
            </li>
          ))}
        </ul>
      )}
      {location && (
        <div className="support-customer__location-preview">
          <FaMapMarkerAlt />
          <span>Votre position sera jointe à ce message.</span>
          <button type="button" onClick={() => setLocation(null)}>
            Retirer
          </button>
        </div>
      )}
      <small className="support-customer__composer-hint">
        Jusqu'à 4 images ou vidéos (15 Mo chacune). Votre position n'est partagée
        qu'après avoir appuyé sur le bouton.
      </small>
    </>
  );

  const startConversation = async (event) => {
    event.preventDefault();
    if (!subject.trim()) {
      openToast("error", "Le sujet est obligatoire");
      return;
    }
    if (!message.trim() && attachments.length === 0 && !location) {
      openToast("error", "Ajoutez un message, une pièce jointe ou votre position");
      return;
    }
    setSending(true);
    const formData = createMessageFormData(message);
    formData.append("subject", subject);
    const response = await uploadImages("/api/support-conversations/mine", formData);
    setSending(false);
    if (!response?.success) {
      openToast("error", response?.message || "Impossible d'envoyer votre message");
      return;
    }
    setSubject("");
    setMessage("");
    setAttachments([]);
    setLocation(null);
    setShowNewConversation(false);
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    openToast("success", "Votre message a été envoyé au service client");
    await loadConversations();
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if ((!reply.trim() && attachments.length === 0 && !location) || !selected) return;
    setSending(true);
    const response = await uploadImages(
      `/api/support-conversations/mine/${selected._id}/messages`,
      createMessageFormData(reply),
    );
    setSending(false);
    if (!response?.success) {
      openToast("error", response?.message || "Impossible d'envoyer votre réponse");
      return;
    }
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    setReply("");
    setAttachments([]);
    setLocation(null);
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
              setReply("");
              setMessage("");
              setAttachments([]);
              setLocation(null);
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
              />
              {renderComposerTools()}
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
                    <MessageMedia message={item} />
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
                />
                {renderComposerTools()}
                <button
                  type="submit"
                  disabled={
                    sending ||
                    (!reply.trim() && attachments.length === 0 && !location)
                  }
                >
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
