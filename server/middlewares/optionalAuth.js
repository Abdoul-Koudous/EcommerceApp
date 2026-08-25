// server/middlewares/optionalAuth.js
import jwt from "jsonwebtoken";

// ✅ Contrairement à auth.js, ce middleware NE BLOQUE JAMAIS l'accès.
// Il essaie de décoder le token s'il existe et, si valide, attache
// req.userId — sinon la requête continue simplement sans req.userId
// (cas du visiteur anonyme, identifié alors par son sessionId côté panier).
const optionalAuth = async (request, response, next) => {
  try {
    const authHeader = request.headers?.authorization;
    let token =
      request.cookies?.accessToken || (authHeader && authHeader.split(" ")[1]);

    if (token === "null" || token === "undefined") {
      token = null;
    }

    if (!token) {
      return next(); // pas de token = visiteur anonyme, on continue
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    if (decode?.id) {
      request.userId = decode.id;
    }

    next();
  } catch (error) {
    // Token invalide/expiré : on ne bloque pas, on traite juste comme anonyme
    next();
  }
};

export default optionalAuth;