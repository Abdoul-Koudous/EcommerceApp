// client/src/pages/utils/tracking.js
import { postData } from "./api";

const ATTRIBUTION_KEY = "yebou_campaign_attribution";
const SESSION_ID_KEY = "yebou_session_id";

export function captureUtmFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get("utm_source");

  if (!utm_source) return;

  const attribution = {
    source: utm_source,
    medium: params.get("utm_medium") || "",
    campaign: params.get("utm_campaign") || "",
    campaignLinkId: params.get("clid") || "",
  };

  sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
}

function getAttribution() {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ✅ MODIFIÉ : exporté, réutilisé aussi par le panier invité (UserContext)
// pour n'avoir qu'un seul identifiant de session par visiteur.
export function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export function trackEvent(type, extra = {}) {
  const attribution = getAttribution();

  const payload = {
    type,
    sessionId: getSessionId(),
    source: attribution?.source || "",
    medium: attribution?.medium || "",
    campaign: attribution?.campaign || "",
    campaignLinkId: attribution?.campaignLinkId || undefined,
    ...extra,
  };

  postData("/api/campaign/track", payload).catch(() => {});
}