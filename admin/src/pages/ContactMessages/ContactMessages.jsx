import React, { useState, useEffect, useContext, useRef } from "react";
import { fetchDataFromApi, editData, deleteData, uploadImages } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import { FaEnvelope, FaEnvelopeOpen, FaTrash, FaTimes, FaPaperPlane, FaImage, FaFileVideo } from "react-icons/fa";
import "./contactmessages.scss";

const ContactMessages = () => {
  const { openToast } = useContext(ToastContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const fileInputRef = useRef(null);

  const loadMessages = () => {
    setLoading(true);
    let url = `/api/contact-message?page=${page}&perPage=15`;
    if (filter === "unread") url += "&isRead=false";
    if (filter === "read") url += "&isRead=true";

    fetchDataFromApi(url).then((res) => {
      if (res?.success) {
        setMessages(res.data);
        setTotalPages(res.totalPages || 1);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const openMessage = (msg) => {
    setSelected(msg);
    setReplyText("");
    setReplyFiles([]);

    if (!msg.isRead) {
      editData(`/api/contact-message/${msg._id}/read`, { isRead: true }).then((res) => {
        if (res?.success) {
          setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m)));
          setSelected((prev) => (prev ? { ...prev, isRead: true } : prev));
        }
      });
    }
  };

  const toggleRead = (msg, e) => {
    e.stopPropagation();
    const newStatus = !msg.isRead;

    editData(`/api/contact-message/${msg._id}/read`, { isRead: newStatus }).then((res) => {
      if (res?.success) {
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, isRead: newStatus } : m)));
        openToast("success", newStatus ? "Marqué comme lu" : "Marqué comme non lu");
      }
    });
  };

  const handleDelete = (id, e) => {
    e?.stopPropagation();
    if (!window.confirm("Supprimer ce message définitivement ?")) return;

    deleteData(`/api/contact-message/${id}`).then((res) => {
      if (res?.success) {
        setMessages((prev) => prev.filter((m) => m._id !== id));
        if (selected?._id === id) setSelected(null);
        openToast("success", "Message supprimé");
      } else {
        openToast("error", "Erreur lors de la suppression");
      }
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // === PIÈCES JOINTES DE LA RÉPONSE ===
  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setReplyFiles((prev) => [...prev, ...files]);
    e.target.value = ""; // permet de re-sélectionner le même fichier si besoin
  };

  const removeReplyFile = (index) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // === ENVOI DE LA RÉPONSE ===
  const handleSendReply = () => {
    if (!replyText.trim() && replyFiles.length === 0) {
      openToast("error", "Ajoutez un texte ou une pièce jointe");
      return;
    }

    const formData = new FormData();
    formData.append("text", replyText);
    replyFiles.forEach((file) => formData.append("attachments", file));

    setSendingReply(true);

    uploadImages(`/api/contact-message/${selected._id}/reply`, formData)
      .then((res) => {
        if (res?.success) {
          openToast("success", "Réponse envoyée par email");
          setSelected(res.data);
          setMessages((prev) => prev.map((m) => (m._id === res.data._id ? res.data : m)));
          setReplyText("");
          setReplyFiles([]);
        } else {
          openToast("error", res?.message || "Erreur lors de l'envoi");
        }
      })
      .catch(() => openToast("error", "Erreur réseau lors de l'envoi"))
      .finally(() => setSendingReply(false));
  };

  const isImageFile = (file) => file.type.startsWith("image/");
  const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isVideoUrl = (url) => /\.(mp4|mov|webm|avi)$/i.test(url);

  return (
    <div className="messages-admin">
      <div className="messages-admin__header">
        <h2>Messages reçus</h2>

        <div className="filter-tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => { setFilter("all"); setPage(1); }}>
            Tous
          </button>
          <button className={filter === "unread" ? "active" : ""} onClick={() => { setFilter("unread"); setPage(1); }}>
            Non lus
          </button>
          <button className={filter === "read" ? "active" : ""} onClick={() => { setFilter("read"); setPage(1); }}>
            Lus
          </button>
        </div>
      </div>

      <div className="messages-layout">
        {/* LISTE */}
        <div className="messages-list">
          {loading ? (
            <div className="empty-state">Chargement...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">Aucun message</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`message-row ${!msg.isRead ? "unread" : ""} ${selected?._id === msg._id ? "selected" : ""}`}
                onClick={() => openMessage(msg)}
              >
                <div className="message-row__icon" onClick={(e) => toggleRead(msg, e)}>
                  {msg.isRead ? <FaEnvelopeOpen /> : <FaEnvelope />}
                </div>
                <div className="message-row__content">
                  <div className="message-row__top">
                    <span className="name">{msg.name}</span>
                    <span className="date">{formatDate(msg.createdAt)}</span>
                  </div>
                  <div className="subject">{msg.subject || "(Sans sujet)"}</div>
                  <div className="preview">{msg.message}</div>
                  {msg.replies?.length > 0 && (
                    <span className="reply-badge">{msg.replies.length} réponse(s)</span>
                  )}
                </div>
                <button className="message-row__delete" onClick={(e) => handleDelete(msg._id, e)} title="Supprimer">
                  <FaTrash />
                </button>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Précédent</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</button>
            </div>
          )}
        </div>

        {/* DÉTAIL + CHAT */}
        {selected && (
          <div className="message-detail">
            <button className="close-btn" onClick={() => setSelected(null)}>
              <FaTimes />
            </button>

            <h3>{selected.subject || "(Sans sujet)"}</h3>

            <div className="detail-meta">
              <p><strong>De :</strong> {selected.name}</p>
              <p><strong>Email :</strong> {selected.email}</p>
              <p><strong>Reçu le :</strong> {formatDate(selected.createdAt)}</p>
            </div>

            {/* FIL DE CONVERSATION */}
            <div className="chat-thread">
              {/* Message original du client */}
              <div className="chat-bubble chat-bubble--client">
                <p>{selected.message}</p>
                <span className="chat-bubble__time">{formatDate(selected.createdAt)}</span>
              </div>

              {/* Réponses de l'admin */}
              {selected.replies?.map((reply, i) => (
                <div className="chat-bubble chat-bubble--admin" key={i}>
                  {reply.text && <p>{reply.text}</p>}
                  {reply.attachments?.length > 0 && (
                    <div className="chat-bubble__attachments">
                      {reply.attachments.map((url, j) =>
                        isImageUrl(url) ? (
                          <img key={j} src={url} alt="pièce jointe" />
                        ) : isVideoUrl(url) ? (
                          <video key={j} src={url} controls />
                        ) : (
                          <a key={j} href={url} target="_blank" rel="noopener noreferrer">
                            📎 Fichier joint
                          </a>
                        )
                      )}
                    </div>
                  )}
                  <span className="chat-bubble__time">{formatDate(reply.sentAt)}</span>
                </div>
              ))}
            </div>

            {/* ZONE DE RÉPONSE */}
            <div className="chat-composer">
              {replyFiles.length > 0 && (
                <div className="chat-composer__previews">
                  {replyFiles.map((file, i) => (
                    <div className="preview-chip" key={i}>
                      {isImageFile(file) ? <FaImage /> : <FaFileVideo />}
                      <span>{file.name}</span>
                      <button onClick={() => removeReplyFile(i)}>
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="chat-composer__input-row">
                <button
                  className="attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre une image ou vidéo"
                  type="button"
                >
                  <FaImage />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFilesSelect}
                />

                <textarea
                  placeholder="Écrivez votre réponse..."
                  rows="2"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />

                <button
                  className="send-btn"
                  onClick={handleSendReply}
                  disabled={sendingReply}
                  title="Envoyer par email"
                  type="button"
                >
                  <FaPaperPlane /> {sendingReply ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn-delete" onClick={(e) => handleDelete(selected._id, e)}>
                <FaTrash /> Supprimer la conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessages;