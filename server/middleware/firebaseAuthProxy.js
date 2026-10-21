import https from "node:https";

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export default function firebaseAuthProxy(req, res) {
  const targetHost = process.env.FIREBASE_AUTH_PROXY_HOST;

  if (!targetHost || !/^[a-z0-9.-]+$/i.test(targetHost)) {
    console.error("FIREBASE_AUTH_PROXY_HOST is missing or invalid.");
    return res.status(503).send("Le service d'authentification est indisponible.");
  }

  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(
      ([name]) => !hopByHopHeaders.has(name.toLowerCase()),
    ),
  );
  headers.host = targetHost;

  const proxyRequest = https.request(
    {
      hostname: targetHost,
      port: 443,
      path: req.originalUrl,
      method: req.method,
      headers,
    },
    (proxyResponse) => {
      const responseHeaders = Object.fromEntries(
        Object.entries(proxyResponse.headers).filter(
          ([name]) => !hopByHopHeaders.has(name.toLowerCase()),
        ),
      );

      res.writeHead(proxyResponse.statusCode || 502, responseHeaders);
      proxyResponse.pipe(res);
    },
  );

  proxyRequest.on("error", (error) => {
    console.error("Firebase Auth helper proxy failed:", error.message);
    if (!res.headersSent) {
      res.status(502).send("Impossible de joindre le service d'authentification.");
    } else if (!res.destroyed) {
      res.destroy(error);
    }
  });

  req.on("aborted", () => proxyRequest.destroy());
  req.pipe(proxyRequest);
}
