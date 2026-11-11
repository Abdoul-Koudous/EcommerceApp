import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FaComments,
  FaMapMarkerAlt,
  FaPaperclip,
  FaPaperPlane,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import { ToastContext } from "../../context/ToastContext";
import { editData, fetchDataFromApi, uploadImages } from "../utils/api";
import "./supportinbox.scss";

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const MessageMedia = ({ message }) => (
  <>
    {message.text && <p>{message.text}</p>}
    {message.attachments?.length > 0 && (
      <div className="support-inbox__media">
        {message.attachments.map((attachment) => (
          <a
            key={attachment.url}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="support-inbox__attachment"
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
        className="support-inbox__location"
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

const SupportInbox = () => {
  const { openToast } = useContext(ToastContext);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("open");
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [location, setLocation] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const selectedIdRef = useRef(null);
  const selectedLatestMessageIdRef = useRef(null);
  const pollingRef = useRef(false);
  const fileInputRef = useRef(null);
  const syncNotificationsRef = useRef(() => {});
  const toastRef = useRef(openToast);
  const unreadByConversationRef = useRef(new Map());
  const hasUnreadSnapshotRef = useRef(false);
  const [syncStatus, setSyncStatus] = useState("Actualisation automatique active");
  toastRef.current = openToast;

  const syncConversationNotifications = (items) => {
    let newMessage;
    items.forEach((conversation) => {
      const unread = conversation.unreadByAdmin || 0;
      const previous = unreadByConversationRef.current.get(conversation._id);
      if (
        hasUnreadSnapshotRef.current &&
        unread > 0 &&
        (previous === undefined || unread > previous)
      ) {
        newMessage ||= conversation;
      }
      unreadByConversationRef.current.set(conversation._id, unread);
    });
    hasUnreadSnapshotRef.current = true;

    if (newMessage) {
      toastRef.current(
        "info",
        `Nouveau message de ${newMessage.userId?.name || "un client"} : « ${newMessage.subject} »`,
      );
    }
    return newMessage?._id;
  };
  syncNotificationsRef.current = syncConversationNotifications;

  const loadConversations = async () => {
    setLoading(true);
    const response = await fetchDataFromApi(
      `/api/support-conversations/admin?status=${filter}`,
    );
    if (response?.success) {
      const items = response.data || [];
      syncConversationNotifications(items);
      setConversations(items);
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
        const items = listResponse.data || [];
        const notifiedConversationId = syncNotificationsRef.current(items);
        setConversations(items);

        const selectedId = selectedIdRef.current;
        if (selectedId) {
          const detailResponse = await fetchDataFromApi(
            `/api/support-conversations/admin/${selectedId}?markRead=false`,
          );
          if (detailResponse?.success) {
            const latestMessage = detailResponse.data.messages?.at(-1);
            if (
              latestMessage?.sender === "customer" &&
              latestMessage._id !== selectedLatestMessageIdRef.current &&
              notifiedConversationId !== selectedId
            ) {
              const conversation = items.find((item) => item._id === selectedId);
              toastRef.current(
                "info",
                `Nouveau message de ${conversation?.userId?.name || "un client"} : « ${conversation?.subject || "conversation"} »`,
              );
            }
            if (latestMessage) {
              selectedLatestMessageIdRef.current = latestMessage._id;
            }
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
    selectedLatestMessageIdRef.current =
      response.data.messages?.at(-1)?._id || null;
    setReply("");
    setAttachments([]);
    setLocation(null);
    await loadConversations();
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if ((!reply.trim() && attachments.length === 0 && !location) || !selected) return;
    const formData = new FormData();
    formData.append("message", reply);
    attachments.forEach((file) => formData.append("attachments", file));
    if (location) formData.append("location", JSON.stringify(location));
    setSending(true);
    const response = await uploadImages(
      `/api/support-conversations/admin/${selected._id}/messages`,
      formData,
    );
    setSending(false);
    if (!response?.success) {
      openToast("error", response?.message || "Impossible d'envoyer la réponse");
      return;
    }
    setSelected(response.data);
    selectedIdRef.current = response.data._id;
    selectedLatestMessageIdRef.current =
      response.data.messages?.at(-1)?._id || null;
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
    if (
      files.some(
        (file) =>
          !ACCEPTED_ATTACHMENT_TYPES.has(file.type) ||
          file.size > MAX_ATTACHMENT_SIZE,
      )
    ) {
      openToast("error", "Choisissez une image ou vidéo acceptée de 15 Mo maximum");
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
        openToast("error", "Impossible d'obtenir la position. Vérifiez l'autorisation du navigateur.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const renderComposerTools = () => (
    <>
      <div className="support-inbox__composer-tools">
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
        <ul className="support-inbox__attachment-list">
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
        <div className="support-inbox__location-preview">
          <FaMapMarkerAlt />
          <span>Votre position sera jointe à la réponse.</span>
          <button type="button" onClick={() => setLocation(null)}>
            Retirer
          </button>
        </div>
      )}
      <small className="support-inbox__composer-hint">
        Jusqu'à 4 images ou vidéos (15 Mo chacune). La position n'est partagée
        qu'après avoir appuyé sur le bouton.
      </small>
    </>
  );

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
                    <MessageMedia message={message} />
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
